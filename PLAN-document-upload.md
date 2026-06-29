# Plan: 产品文档上传/下载功能

## 概述
在产品管理页面为每个产品添加文档管理能力，支持上传、下载、删除 PDF/Word/Excel 文件。

---

## 架构设计

### 数据流
```
Frontend (a-upload) → POST /api/v1/products/:id/documents (multipart/form-data)
                    → GET  /api/v1/products/:id/documents (list)
                    → GET  /api/v1/products/:id/documents/:docId/download
                    → DELETE /api/v1/products/:id/documents/:docId

Backend multer → 文件存 ABS/uploads/ → 元数据存 PostgreSQL documents 表
```

### 实体关系
```
Product (1) ──── (N) Document
  - 已存在 OneToMany → ScheduleEvent
  - 新增 OneToMany → Document
```

---

## 后端改动

### 1. 安装依赖
```bash
cd ABS/packages/backend && npm install multer
```
`@types/multer` 已随 NestJS 内置（`FileInterceptor` 从 `@nestjs/platform-express` 导出）。

### 2. 新建文件清单

| 文件 | 说明 |
|------|------|
| `src/modules/document/entities/document.entity.ts` | Document 实体：id, productId(FK), fileName(存储名), originalName(原始名), mimeType, fileSize, createdAt, isDeleted(软删除), ManyToOne→Product |
| `src/modules/document/document.service.ts` | CRUD + 文件系统操作：upload(保存文件+写DB), findAllByProduct, download(读文件流), remove(软删除+删文件) |
| `src/modules/document/document.controller.ts` | 4个端点：POST upload, GET list, GET download, DELETE remove |
| `src/modules/document/document.module.ts` | 注册 TypeORM feature + controller + service |
| `src/config/multer.config.ts` | multer 配置：diskStorage 存 `ABS/uploads/`，文件名校验（UUID防冲突），格式白名单（pdf/doc/docx/xls/xlsx），大小限制 50MB |

### 3. 修改文件

| 文件 | 改动 |
|------|------|
| `src/modules/product/entities/product.entity.ts` | 新增 `@OneToMany(() => Document, doc => doc.product)` |
| `src/app.module.ts` | imports 中加入 `DocumentModule` |
| `src/config/database.config.ts` | 无需改动，`synchronize: true` 会自动建表 |

### 4. API 设计

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/api/v1/products/:productId/documents` | 上传文档 | multipart/form-data, field: `file` | `Document` JSON |
| GET | `/api/v1/products/:productId/documents` | 获取文档列表 | - | `Document[]` |
| GET | `/api/v1/products/:productId/documents/:id/download` | 下载文档 | - | 文件流 (Content-Disposition: attachment) |
| DELETE | `/api/v1/products/:productId/documents/:id` | 删除文档 | - | `{ success: true }` |

---

## 前端改动

### 1. 新建文件清单

| 文件 | 说明 |
|------|------|
| `src/types/document.ts` | `Document` 接口：id, productId, fileName, originalName, mimeType, fileSize, createdAt |
| `src/api/document.api.ts` | `documentApi` 对象：upload(productId, file), list(productId), getDownloadUrl(id), remove(productId, docId) |
| `src/components/document/DocumentManagerModal.vue` | 文档管理弹窗组件（详见下方） |

### 2. 修改文件

| 文件 | 改动 |
|------|------|
| `src/views/ProductManageView.vue` | 操作列新增"文档"按钮，引入 DocumentManagerModal |

### 3. DocumentManagerModal 组件设计

```
┌─────────────────────────────────────────┐
│  产品文档管理 - [产品名称]               │
├─────────────────────────────────────────┤
│  [上传文档] 按钮 (限制 pdf/doc/docx/     │
│              xls/xlsx, ≤50MB)           │
├─────────────────────────────────────────┤
│  文档列表 (a-table)                      │
│  ┌──────┬──────┬──────┬──────┬──────┐  │
│  │ 文件名│ 类型 │ 大小 │ 时间 │ 操作 │  │
│  ├──────┼──────┼──────┼──────┼──────┤  │
│  │xx.pdf│ PDF  │ 2MB  │ ...  │⬇ 📋 │  │
│  └──────┴──────┴──────┴──────┴──────┘  │
├─────────────────────────────────────────┤
│                              [关闭]     │
└─────────────────────────────────────────┘
```

- `a-upload` 组件，accept=".pdf,.doc,.docx,.xls,.xlsx"，beforeUpload 中调用 API
- 下载使用 `<a>` 标签直接链接到 download 端点
- 删除带确认弹窗
- 通过 props 接收 `productId`，v-model:open 控制显示

### 4. UI 细节
- 文件大小格式化：< 1KB 显示 "xx B"，< 1MB 显示 "xx KB"，否则 "xx MB"
- 文件类型图标：根据扩展名显示不同颜色 tag（PDF=红色, Word=蓝色, Excel=绿色）
- 上传时显示 loading 状态
- 空列表时显示 `a-empty`

---

## Vercel 兼容性预留
- 文件存储路径通过环境变量 `UPLOAD_DIR` 配置（默认 `./uploads/`）
- 后续部署 Vercel 时可切换为 S3/Blob Storage，只需修改 service 层
- 下载端点返回 stream 而非静态文件路径

---

## 实现顺序
1. 安装 multer 依赖
2. 创建 Document 实体
3. 更新 Product 实体关联
4. 创建 multer 配置
5. 创建 DocumentService + DocumentController + DocumentModule
6. 注册到 AppModule
7. 创建前端类型 + API
8. 创建 DocumentManagerModal 组件
9. 修改 ProductManageView 集成
10. Type-check + 端到端测试