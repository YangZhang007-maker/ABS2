# Plan: 登录认证 + 权限管理 + 文件检索

---

## 一、数据模型设计

### 1.1 User 实体（新建）
```
users 表
├── id (uuid, PK)
├── username (varchar, unique, 登录账号)
├── password (varchar, bcrypt hashed)
├── name (varchar, 姓名)
├── role (enum: 'root' | 'product_owner' | 'sales')
├── is_deleted (boolean, default false)
├── created_at / updated_at
```

### 1.2 Product 实体改动
- **新增字段** `creatorId` (uuid, FK → users.id)
- **保留** `creator` 字段作为显示名（冗余，方便前端显示）
- **新增 ManyToMany** `salespersons: User[]` 通过 `product_salespersons` 中间表

### 1.3 product_salespersons 中间表 (TypeORM 自动创建)
```
product_id (uuid, FK → products.id)
user_id   (uuid, FK → users.id)
```

### 1.4 角色-权限矩阵
| 操作 | root | product_owner | sales |
|------|------|--------------|-------|
| 查看产品列表 | 全部 | 自己创建的 | 被添加到的 |
| 创建产品 | ✅ | 创建后自己为 creator | ❌ |
| 编辑/删除产品 | ✅ | 仅自己的 | ❌ |
| 管理销售人 | ✅ | 仅自己的产品 | ❌ |
| 查看日程 | 全部 | 自己产品的 | 被添加产品的 |
| 创建/编辑/删除日程 | ✅ | 仅自己的产品 | ❌ |
| 创建/编辑/删除提醒 | ✅ | 仅自己的产品 | ❌ |
| 上传文档 | ✅ | 仅自己的产品 | 被添加产品的 |
| 下载文档 | ✅ | 自己产品的 | 被添加产品的 |
| 删除文档 | ✅ | 仅自己的产品 | ❌ |

---

## 二、后端实现

### 2.1 新建文件

| 文件 | 说明 |
|------|------|
| `src/common/enums/user-role.enum.ts` | `UserRole` 枚举 + 标签映射 |
| `src/common/guards/jwt-auth.guard.ts` | JWT 验证守卫，解析 token 挂载到 `req.user` |
| `src/common/guards/roles.guard.ts` | 角色守卫，配合 `@Roles()` 装饰器 |
| `src/common/decorators/roles.decorator.ts` | `@Roles(UserRole.ROOT, UserRole.PRODUCT_OWNER)` |
| `src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` 参数装饰器，从 req.user 取当前用户 |
| `src/modules/auth/auth.module.ts` | 认证模块注册 |
| `src/modules/auth/auth.controller.ts` | `POST /auth/login`，`GET /auth/me` |
| `src/modules/auth/auth.service.ts` | 验证密码、签发 JWT、返回用户信息 |
| `src/modules/auth/dto/login.dto.ts` | `{ username, password }` |
| `src/modules/user/entities/user.entity.ts` | User 实体 |
| `src/modules/user/user.module.ts` | 用户模块（含 seed 逻辑） |
| `src/modules/user/user.service.ts` | findAll, findById, create, seed 初始用户 |
| `src/modules/user/user.controller.ts` | 用户 CRUD（仅 root） |
| `src/modules/user/dto/user.dto.ts` | CreateUserDto, UpdateUserDto |

### 2.2 修改文件

| 文件 | 改动 |
|------|------|
| `src/modules/product/entities/product.entity.ts` | +creatorId FK, +@ManyToMany salespersons |
| `src/modules/product/product.service.ts` | findAll/update/remove 增加权限过滤 |
| `src/modules/product/product.controller.ts` | +`@UseGuards(JwtAuthGuard)`，创建时自动设 creatorId |
| `src/modules/product/dto/product.dto.ts` | +salespersonIds 字段（添加/移除销售人员） |
| `src/modules/schedule-event/schedule-event.service.ts` | 增加权限过滤 |
| `src/modules/schedule-event/schedule-event.controller.ts` | +`@UseGuards(JwtAuthGuard)` |
| `src/modules/reminder-event/*` | 同上 |
| `src/modules/document/document.service.ts` | 增加权限过滤，新增 search 方法 |
| `src/modules/document/document.controller.ts` | +`@UseGuards(JwtAuthGuard)`，+`GET /documents/search?q=` |
| `src/modules/dashboard/dashboard.service.ts` | 增加权限过滤（通过 user 可访问的 products） |
| `src/modules/dashboard/dashboard.controller.ts` | +`@UseGuards(JwtAuthGuard)`，传入 user |
| `src/modules/product/product.module.ts` | imports 中加入 User entity |
| `src/app.module.ts` | 注册 AuthModule, UserModule |
| `src/main.ts` | 全局启用 JwtAuthGuard（optional: 用 APP_GUARD） |

### 2.3 权限过滤的核心模式

每个 service 的查询方法接受一个 `userId: string` 和 `role: UserRole` 参数：

```typescript
// 伪代码 — ProductService.findAll
if (role === UserRole.ROOT) {
  return this.productRepository.find({ where: { isDeleted: false } });
} else if (role === UserRole.PRODUCT_OWNER) {
  return this.productRepository.find({ where: { creatorId: userId, isDeleted: false } });
} else if (role === UserRole.SALES) {
  // 查询 product_salespersons 中间表
  return this.productRepository
    .createQueryBuilder('p')
    .innerJoin('p.salespersons', 'sp', 'sp.id = :userId', { userId })
    .where('p.is_deleted = false')
    .getMany();
}
```

### 2.4 文件检索 API

```
GET /api/v1/documents/search?q=关键词
```
- 所有用户：搜索自己有权限访问的产品下的文档
- 按 `originalName` LIKE `%关键词%` 匹配
- 返回 `{ id, originalName, mimeType, fileSize, createdAt, productName }`

### 2.5 种子数据

启动时自动创建 3 个测试用户：
| 用户名 | 密码 | 角色 | 姓名 |
|--------|------|------|------|
| root | admin123 | root | 部门总负责人 |
| owner1 | admin123 | product_owner | 产品负责人A |
| sales1 | admin123 | sales | 销售人员A |

---

## 三、前端实现

### 3.1 新建文件

| 文件 | 说明 |
|------|------|
| `src/types/auth.ts` | LoginData, UserInfo 接口 |
| `src/api/auth.api.ts` | login(), getMe() |
| `src/stores/auth.store.ts` | token + userInfo + login/logout/isLoggedIn |
| `src/views/LoginView.vue` | 登录页：用户名+密码表单，调用 authStore.login |
| `src/components/product/SalespersonManager.vue` | 销售人员管理组件（选择已有 sales 角色用户，显示已添加列表，增删） |

### 3.2 修改文件

| 文件 | 改动 |
|------|------|
| `src/router/index.ts` | +`/login` 路由，+全局导航守卫（beforeEach 检查登录状态） |
| `src/api/client.ts` | 请求拦截器加 `Authorization: Bearer <token>`，401 时跳转登录页 |
| `src/views/DefaultLayout.vue` | 无改动（layout 结构不变） |
| `src/components/layout/AppHeader.vue` | 右侧显示用户名 + 退出登录按钮 |
| `src/components/layout/AppSidebar.vue` | 产品列表按权限过滤（API 层已过滤，前端自动显示正确数据） |
| `src/views/ProductManageView.vue` | 操作列 +"销售人员" 按钮；创建时自动关联当前用户为 creator |
| `src/components/document/DocumentManagerModal.vue` | 新增搜索输入框，调用 search API |
| `src/types/product.ts` | +salespersons 字段 |

### 3.3 路由守卫逻辑
```
beforeEach:
  if (去 /login) → 放行
  if (没有 token) → 跳转 /login
  if (有 token 但没有 userInfo) → 调用 /auth/me 获取用户信息
  → 放行
```

### 3.4 登录页设计
```
┌──────────────────────────────────┐
│                                  │
│    ABS 存续期智能提醒系统         │
│                                  │
│  ┌─────────────────────────┐     │
│  │  用户名                  │     │
│  │  [_______________]      │     │
│  │  密码                    │     │
│  │  [_______________]      │     │
│  │                          │     │
│  │  [      登 录      ]    │     │
│  └─────────────────────────┘     │
│                                  │
└──────────────────────────────────┘
```
- 居中卡片布局，白色背景
- 登录成功后跳转到 `/`（dashboard）

---

## 四、技术选型与依赖

### 后端新增依赖
- `@nestjs/jwt` — JWT 签发与验证
- `@nestjs/passport` + `passport` + `passport-jwt` — JWT 策略
- `bcryptjs` — 密码哈希（纯 JS，无需编译）
- `uuid` — 已有 crypto.randomUUID，无需额外安装

### 前端无需新增依赖
- 使用现有的 axios + pinia + vue-router 即可

---

## 五、实现顺序

1. 创建 UserRole 枚举
2. 创建 User 实体，更新 Product 实体（+creatorId, +salespersons）
3. 安装 JWT/bcrypt 依赖
4. 创建 User 模块（entity + service + controller + module）
5. 创建 Auth 模块（login + me + JWT strategy）
6. 创建 JWT Guard、Roles Guard、装饰器
7. 改造 Product 模块（权限过滤 + 销售人员管理接口）
8. 改造 ScheduleEvent / ReminderEvent 模块（权限过滤）
9. 改造 Document 模块（权限过滤 + 搜索接口）
10. 改造 Dashboard 模块（权限过滤）
11. 全局启用 Guard、创建种子数据
12. 前端：auth types + api + store
13. 前端：LoginView + 路由守卫
14. 前端：AppHeader 用户信息 + 退出
15. 前端：ProductManageView 销售人员管理
16. 前端：DocumentManagerModal 搜索
17. Type-check + 端到端测试