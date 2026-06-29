#!/usr/bin/env bash
# ============================================
# ABS 存续期智能提醒系统 - 快速启动脚本
# ============================================
# 仅启动服务，不做环境检查（需先运行 setup.sh）
# 使用：bash start.sh
# ============================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/packages/backend"
FRONTEND_DIR="$ROOT_DIR/packages/frontend"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "========================================"
echo "  ABS 系统 - 启动服务"
echo "========================================"
echo ""

# 启动 PostgreSQL（如果未运行）
if ! docker ps --format '{{.Names}}' | grep -q 'abs_postgres'; then
  echo -e "${BLUE}[INFO]${NC}  启动 PostgreSQL ..."
  cd "$ROOT_DIR"
  docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null
  sleep 2
fi

# 关闭旧进程
echo -e "${BLUE}[INFO]${NC}  关闭旧进程 ..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
sleep 1

# 启动后端
echo -e "${BLUE}[INFO]${NC}  启动后端 (localhost:3001) ..."
cd "$BACKEND_DIR"
nohup node dist/main.js > /tmp/abs-backend.log 2>&1 &
sleep 2

# 启动前端
echo -e "${BLUE}[INFO]${NC}  启动前端 (localhost:5174) ..."
cd "$FRONTEND_DIR"
nohup npx vite --host 0.0.0.0 --port 5174 > /tmp/abs-frontend.log 2>&1 &
sleep 3

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 启动完成！${NC}"
echo -e "${GREEN}  前端: http://localhost:5174${NC}"
echo -e "${GREEN}  API:  http://localhost:3001/api/v1${NC}"
echo -e "${GREEN}  停止: bash stop.sh${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""