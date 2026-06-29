# ABS 存续期智能提醒系统

面向 ABS（资产支持证券）业务人员的存续期日程管理工具，支持产品创建、日程事件管理、智能提醒、邮件通知与文档管理。

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始（新电脑上 3 步运行）](#快速开始新电脑上-3-步运行)
  - [前置要求](#前置要求)
  - [一键初始化](#一键初始化)
  - [手动启动方式](#手动启动方式)
- [脚本说明](#脚本说明)
- [默认账号](#默认账号)
- [项目结构](#项目结构)
- [权限体系](#权限体系)
- [API 接口](#api-接口)
- [环境变量](#环境变量)
- [常见问题](#常见问题)

---

## 功能特性

- 🏷️ **产品管理** — 创建、编辑、删除 ABS 产品，搜索与分页
- 📅 **日程事件** — 设立日/兑付日/计算日 + 自定义事件类型，待办/已完成双视图
- 🔔 **提醒事件** — 基于日程日期 T-n / R-n 提前提醒，或手动指定日期
- 📊 **日程安排表** — 统一视图展示所有待办/已完成事件，按产品过滤
- 📎 **文档管理** — 上传/下载/搜索产品相关文档
- 👤 **权限管理** — 三级角色（总负责人/产品负责人/销售人员），细粒度权限
- 📧 **邮件通知** — 每天 9:00 自动发送当日日程/提醒邮件
- 🔐 **JWT 认证** — 登录/注册/个人资料管理

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Ant Design Vue 4 + Pinia + Vite |
| 后端 | NestJS + TypeScript + TypeORM |
| 数据库 | PostgreSQL 16 |
| 邮件 | nodemailer + @nestjs/schedule |
| 文件 | multer 本地存储 |

---

## 快速开始（新电脑上 3 步运行）

### 前置要求

在新电脑上运行之前，你需要安装以下软件：

| 软件 | 最低版本 | 下载/安装方式 |
|------|----------|---------------|
| **Node.js** | 18+ | https://nodejs.org/ （推荐 LTS 版本） |
| **Docker Desktop** | 任意 | https://www.docker.com/products/docker-desktop |
| **Git**（可选） | 任意 | https://git-scm.com/ |

> **macOS 用户**也可以通过 Homebrew 安装：
> ```bash
> brew install node docker git
> brew install --cask docker  # Docker Desktop
> ```

### 一键初始化

拿到项目代码后，只需在终端中运行一条命令：

```bash
cd ABS
bash setup.sh
```

脚本会自动完成以下所有步骤：

1. ✅ 检查 Node.js 和 npm 环境
2. ✅ 检查 Docker 并启动 PostgreSQL 16
3. ✅ 创建数据库 `ABS`
4. ✅ 生成 `.env` 配置文件
5. ✅ 安装前端和后端依赖
6. ✅ 编译后端 TypeScript 代码
7. ✅ 启动后端（端口 3001）和前端（端口 5174）

**完成后打开浏览器访问：http://localhost:5174**

### 手动启动方式

如果你不想使用脚本，也可以按以下步骤手动操作：

#### 1. 启动 PostgreSQL

项目根目录已包含 `docker-compose.yml`，使用 Docker 启动数据库：

```bash
cd ABS
docker compose up -d
```

这会启动一个 PostgreSQL 16 容器，自动创建数据库 `ABS`，用户名 `postgres`，密码 `admin123`。

> 如果你已有本地 PostgreSQL，也可以通过环境变量修改连接信息，详见[环境变量](#环境变量)。

#### 2. 安装依赖 + 编译 + 启动后端

```bash
cd ABS/packages/backend

# 安装依赖
npm install --legacy-peer-deps

# 编译 TypeScript
npx tsc

# 启动后端
node dist/main.js
```

后端运行在 **http://localhost:3001**

#### 3. 安装依赖 + 启动前端

另开一个终端窗口：

```bash
cd ABS/packages/frontend

# 安装依赖
npm install --legacy-peer-deps

# 启动前端开发服务器
npx vite --port 5174
```

前端运行在 **http://localhost:5174**

---

## 脚本说明

项目根目录提供了三个便捷脚本：

| 脚本 | 用途 | 使用场景 |
|------|------|----------|
| `bash setup.sh` | **一键初始化** | 首次在新电脑上运行，完成所有环境配置 |
| `bash start.sh` | **快速启动** | 后续日常启动（跳过依赖安装和编译） |
| `bash stop.sh` | **停止服务** | 关闭前后端进程 |

常用命令：

```bash
# 首次使用
bash setup.sh

# 日常启动（依赖已装好、代码已编译）
bash start.sh

# 停止服务
bash stop.sh

# 查看后端日志
tail -f /tmp/abs-backend.log

# 查看前端日志
tail -f /tmp/abs-frontend.log
```

---

## 默认账号

系统首次启动时自动创建 3 个测试账号（初始密码均为 `admin123`）：

| 用户名 | 角色 | 权限说明 |
|--------|------|----------|
| `root` | 部门总负责人 | 查看/管理所有产品和事件 |
| `owner1` | 产品负责人 | 管理自己创建的产品 |
| `sales1` | 销售人员 | 只读查看产品和文档，无编辑权限 |

> 也可以在登录页面点击**"立即注册"**自行创建账户（注册用户默认角色为"产品负责人"）。

---

## 项目结构

```
ABS/
├── setup.sh                  # 一键初始化脚本
├── start.sh                  # 快速启动脚本
├── stop.sh                   # 停止服务脚本
├── docker-compose.yml        # PostgreSQL Docker 编排
├── .env.example              # 环境变量模板
├── files/
│   └── init.sql              # 数据库初始化 SQL（已不强制使用，TypeORM 自动建表）
├── packages/
│   ├── backend/              # NestJS 后端
│   │   ├── src/
│   │   │   ├── main.ts                   # 入口
│   │   │   ├── app.module.ts             # 根模块
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts    # 数据库连接配置
│   │   │   │   └── multer.config.ts      # 文件上传配置
│   │   │   ├── common/                   # 公共模块
│   │   │   │   ├── decorators/           # @Public, @Roles, @CurrentUser
│   │   │   │   ├── enums/                # UserRole, EventType, DateMode
│   │   │   │   ├── filters/              # HTTP 异常过滤器
│   │   │   │   ├── guards/               # JWT + 角色守卫
│   │   │   │   └── interceptors/         # 响应拦截器（统一格式）
│   │   │   └── modules/
│   │   │       ├── auth/                 # 认证（登录/注册/资料更新）
│   │   │       ├── user/                 # 用户管理
│   │   │       ├── product/              # 产品 CRUD
│   │   │       ├── schedule-event/       # 日程事件 CRUD
│   │   │       ├── reminder-event/       # 提醒事件 CRUD
│   │   │       ├── dashboard/            # 日程安排表聚合查询
│   │   │       ├── document/             # 文件上传/下载/搜索
│   │   │       └── notification/         # 邮件通知（定时任务）
│   │   ├── dist/                         # 编译输出目录
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── frontend/             # Vue 3 前端
│       ├── src/
│       │   ├── main.ts                   # 入口
│       │   ├── App.vue
│       │   ├── api/                      # API 请求层（axios）
│       │   ├── stores/                   # Pinia 状态管理
│       │   ├── router/                   # Vue Router 路由
│       │   ├── types/                    # TypeScript 类型定义
│       │   ├── utils/                    # 工具函数和常量
│       │   ├── components/               # 可复用组件
│       │   │   ├── layout/               # AppHeader, AppSidebar
│       │   │   ├── product/              # ProductFormModal
│       │   │   ├── schedule/             # ScheduleTable, ScheduleEventFormModal
│       │   │   ├── reminder/             # ReminderEventFormModal
│       │   │   └── document/             # DocumentManagerModal
│       │   └── views/                    # 页面视图
│       │       ├── DashboardView.vue         # 日程安排表
│       │       ├── ProductManageView.vue     # 产品管理
│       │       ├── ProductDetailView.vue     # 产品详情
│       │       ├── DocumentSearchView.vue    # 文档检索
│       │       ├── LoginView.vue             # 登录
│       │       ├── RegisterView.vue          # 注册
│       │       ├── ProfileView.vue           # 个人资料
│       │       └── DefaultLayout.vue         # 布局框架
│       ├── vite.config.ts
│       └── package.json
└── uploads/                   # 上传文件存储目录（运行时自动创建）
```

---

## 权限体系

| 功能 | root（总负责人） | product_owner（产品负责人） | sales（销售人员） |
|------|:---:|:---:|:---:|
| 日程安排表 | ✅ | ✅ 仅自己的 | ❌ |
| 产品管理 | ✅ 全部 | ✅ 仅自己的 | ✅ 只读 |
| 创建产品 | ✅ | ✅ | ❌ |
| 编辑/删除产品 | ✅ | ✅ 仅自己的 | ❌ |
| 创建日程 | ✅ | ✅ 仅自己的产品 | ❌ |
| 创建提醒 | ✅ | ✅ 仅自己的产品 | ❌ |
| 完成/取消完成 | ✅ | ✅ 仅自己的 | ❌ |
| 文档上传 | ✅ | ✅ 仅自己的产品 | ❌ |
| 文档下载 | ✅ | ✅ | ✅ |
| 文档删除 | ✅ | ✅ 仅自己的 | ❌ |
| 文档检索 | ✅ | ✅ | ✅ |
| 个人资料 | ✅ | ✅ | ✅ |

---

## API 接口

Base URL: `http://localhost:3001/api/v1`

### 认证 (Auth)
| 方法 | 路径 | 说明 | 公开 |
|------|------|------|:---:|
| POST | `/auth/login` | 登录 | ✅ |
| POST | `/auth/register` | 注册 | ✅ |
| GET | `/auth/me` | 当前用户信息 | |
| PATCH | `/auth/profile` | 更新个人资料 | |

### 产品 (Products)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products?search=&page=&limit=` | 产品列表（分页+搜索） |
| POST | `/products` | 创建产品 |
| GET | `/products/:id` | 产品详情 |
| PATCH | `/products/:id` | 编辑产品 |
| DELETE | `/products/:id` | 删除产品 |

### 日程事件 (Schedule Events)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products/:pid/schedule-events?completed=` | 产品日程列表 |
| POST | `/products/:pid/schedule-events` | 创建日程事件 |
| PATCH | `/schedule-events/:id` | 编辑日程事件 |
| PATCH | `/schedule-events/:id/toggle-complete` | 切换完成状态 |
| DELETE | `/schedule-events/:id` | 删除日程事件 |

### 提醒事件 (Reminder Events)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/schedule-events/:sid/reminders` | 日程提醒列表 |
| POST | `/schedule-events/:sid/reminders` | 创建提醒事件 |
| PATCH | `/reminders/:id` | 编辑提醒事件 |
| PATCH | `/reminders/:id/toggle-complete` | 切换完成状态 |
| DELETE | `/reminders/:id` | 删除提醒事件 |

### 日程总览 (Dashboard)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/dashboard/schedule?search=&page=&limit=` | 日程安排表（分页+搜索） |

### 文档 (Documents)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products/:pid/documents` | 产品文档列表 |
| POST | `/products/:pid/documents` | 上传文档（multipart） |
| GET | `/products/:pid/documents/:id/download` | 下载文档 |
| DELETE | `/products/:pid/documents/:id` | 删除文档 |
| GET | `/documents/search?query=&productName=&page=&limit=` | 全局文档搜索 |

---

## 环境变量

后端配置文件位于 `packages/backend/.env`（首次运行时自动从 `.env.example` 复制）。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_PORT` | `3001` | 后端端口 |
| `DB_HOST` | `localhost` | 数据库地址 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_USERNAME` | `postgres` | 数据库用户名 |
| `DB_PASSWORD` | `admin123` | 数据库密码 |
| `DB_DATABASE` | `ABS` | 数据库名 |
| `JWT_SECRET` | `abs-jwt-secret-key-2024` | JWT 签名密钥 |
| `SMTP_HOST` | `smtp.qq.com` | 邮件 SMTP 服务器 |
| `SMTP_PORT` | `587` | SMTP 端口 |
| `SMTP_USER` | （空） | 发件邮箱地址 |
| `SMTP_PASS` | （空） | SMTP 授权码 |
| `SMTP_FROM` | `noreply@abs.com` | 发件人显示名称 |

> 邮件通知为可选功能。如不配置 SMTP，邮件功能将静默失败，不影响系统的其他功能。

---

## 常见问题

### Q: Docker 启动失败？
确保 Docker Desktop 已启动并运行中。运行 `docker info` 检查状态。

### Q: 端口被占用？
```bash
# 查看端口占用
lsof -i :3001    # 后端
lsof -i :5174    # 前端
lsof -i :5432    # 数据库

# 停止所有 ABS 服务
bash stop.sh
```

### Q: 后端启动报数据库连接错误？
1. 确认 PostgreSQL 是否在运行：`docker compose ps`
2. 确认 `.env` 文件中的数据库连接信息是否正确
3. 检查 `DB_DATABASE` 名称是否为 `ABS`（大写）

### Q: 前端页面空白 / API 502？
可能后端未启动。检查后端状态：
```bash
curl http://localhost:3001/api/v1/auth/login   # 应返回 JSON 响应
tail -f /tmp/abs-backend.log                    # 查看后端日志
```

### Q: 如何重置数据库？
```bash
# 进入 PostgreSQL 容器
docker compose exec postgres psql -U postgres

# 删除并重建数据库
DROP DATABASE "ABS";
CREATE DATABASE "ABS";
\q

# 重启后端（TypeORM 会自动建表 + 种子数据）
bash start.sh
```

### Q: 生产环境部署？
1. 修改 `.env` 中使用强随机 `JWT_SECRET`
2. 前端编译：`cd packages/frontend && npm run build`（输出到 `dist/`）
3. 后端生产启动：`NODE_ENV=production node packages/backend/dist/main.js`
4. 使用 nginx 反向代理前端 dist 目录和后端 API