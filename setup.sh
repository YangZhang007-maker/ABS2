#!/usr/bin/env bash
# ============================================
# ABS 存续期智能提醒系统 - 一键初始化脚本
# ============================================
# 功能：
#   1. 检查 Node.js / npm 环境
#   2. 通过 Docker Compose 启动 PostgreSQL 16
#   3. 创建 .env 配置文件（若不存在）
#   4. 安装前后端依赖
#   5. 编译后端 TypeScript
#   6. 启动后端服务 (端口 3001)
#   7. 启动前端开发服务器 (端口 5174)
#
# 使用：bash setup.sh
# 首次运行会执行全部步骤，后续可直接用 bash start.sh
# ============================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/packages/backend"
FRONTEND_DIR="$ROOT_DIR/packages/frontend"

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[ OK ]${NC}  $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[FAIL]${NC} $1"; }

echo ""
echo "========================================"
echo "  ABS 存续期智能提醒系统 - 环境初始化"
echo "========================================"
echo ""

# ==========================
# 1. 检查 Node.js 和 npm
# ==========================
info "检查 Node.js 和 npm ..."
if ! command -v node &> /dev/null; then
  error "未检测到 Node.js，请先安装 Node.js >= 18"
  echo "  下载地址：https://nodejs.org/zh-cn/"
  echo "  推荐安装 LTS 版本（当前 v22.x）"
  echo ""
  echo "  macOS 也可以通过 Homebrew 安装："
  echo "    brew install node"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  warn "Node.js 版本较低（当前 $(node -v)），建议 >= 18"
fi
success "Node.js: $(node -v) | npm: $(npm -v)"

# ==========================
# 2. 检查 Docker 并启动 PostgreSQL
# ==========================
info "检查 Docker 环境 ..."
if ! command -v docker &> /dev/null; then
  error "未检测到 Docker，请先安装 Docker Desktop"
  echo "  下载地址：https://www.docker.com/products/docker-desktop"
  echo ""
  echo "  macOS: brew install --cask docker"
  echo "  Windows: 下载 Docker Desktop 安装包"
  echo ""
  echo "  如果不使用 Docker，也可以自行安装 PostgreSQL 16，"
  echo "  创建数据库 'ABS'，用户名密码与 .env 一致即可。"
  exit 1
fi
success "Docker 已就绪"

# 确保 Docker 在运行
if ! docker info &> /dev/null; then
  error "Docker 未在运行中，请先启动 Docker Desktop"
  exit 1
fi

info "启动 PostgreSQL 16 (Docker) ..."
cd "$ROOT_DIR"
docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null
sleep 2

# 等待 PostgreSQL 就绪
info "等待 PostgreSQL 启动 ..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if docker compose exec -T postgres pg_isready -U postgres &>/dev/null 2>&1 || \
     docker exec abs_postgres pg_isready -U postgres &>/dev/null 2>&1; then
    success "PostgreSQL 已就绪 (localhost:5432)"
    break
  fi
  RETRY=$((RETRY + 1))
  sleep 1
done

if [ $RETRY -ge $MAX_RETRIES ]; then
  error "PostgreSQL 启动超时，请检查 Docker 状态：docker compose ps"
  exit 1
fi

# 确保 ABS 数据库存在
docker compose exec -T postgres psql -U postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname='ABS'" 2>/dev/null | grep -q 1 || \
  docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE \"ABS\";" 2>/dev/null || true

success "数据库 ABS 已就绪"

# ==========================
# 3. 创建 .env 配置文件
# ==========================
ENV_FILE="$ROOT_DIR/packages/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  info "创建后端 .env 配置文件 ..."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  success ".env 文件已创建（$ENV_FILE）"
  warn "如需邮件通知功能，请编辑此文件填入 SMTP 配置"
else
  info ".env 文件已存在，跳过创建"
fi

# ==========================
# 4. 安装依赖
# ==========================
info "安装后端依赖 ..."
cd "$BACKEND_DIR"
npm install --legacy-peer-deps 2>&1 | tail -1
success "后端依赖安装完成"

info "安装前端依赖 ..."
cd "$FRONTEND_DIR"
npm install --legacy-peer-deps 2>&1 | tail -1
success "前端依赖安装完成"

# ==========================
# 5. 编译后端
# ==========================
info "编译后端 TypeScript ..."
cd "$BACKEND_DIR"
npx tsc 2>&1
success "后端编译完成 (dist/)"

# ==========================
# 6. 启动服务
# ==========================
echo ""
echo "========================================"
echo "  环境初始化完成，正在启动服务..."
echo "========================================"
echo ""

# 停止可能存在的旧进程
info "关闭旧进程（如果存在）..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
sleep 1

# 启动后端
info "启动后端服务 (端口 3001) ..."
cd "$BACKEND_DIR"
nohup node dist/main.js > /tmp/abs-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

if kill -0 $BACKEND_PID 2>/dev/null; then
  success "后端已启动 (PID: $BACKEND_PID)"
else
  error "后端启动失败，查看日志：cat /tmp/abs-backend.log"
  exit 1
fi

# 启动前端
info "启动前端开发服务器 (端口 5174) ..."
nohup npx vite --host 0.0.0.0 --port 5174 > /tmp/abs-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

if kill -0 $FRONTEND_PID 2>/dev/null; then
  success "前端已启动 (PID: $FRONTEND_PID)"
else
  error "前端启动失败，查看日志：cat /tmp/abs-frontend.log"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# ==========================
# 完成
# ==========================
echo ""
echo "========================================"
echo "  🎉 ABS 系统启动成功！"
echo "========================================"
echo ""
echo "  前端地址：  http://localhost:5174"
echo "  后端 API：  http://localhost:3001/api/v1"
echo ""
echo "  测试账号（初始密码均为 admin123）："
echo "    root    — 部门总负责人（全部权限）"
echo "    owner1  — 产品负责人（管理自己的产品）"
echo "    sales1  — 销售人员（只读查看）"
echo ""
echo "  查看日志："
echo "    tail -f /tmp/abs-backend.log"
echo "    tail -f /tmp/abs-frontend.log"
echo ""
echo "  停止服务："
echo "    bash $ROOT_DIR/stop.sh"
echo ""
echo "========================================"