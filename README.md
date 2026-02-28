# 数字信息记录工具

一个基于 Node.js + Express 的轻量后端，支持文本、图片（本地上传）等记录，数据存储在 Supabase 表 `records` 中。

## 快速开始

1. 克隆仓库并安装依赖
   - `npm ci` 或 `npm install`
2. 配置环境变量
   - 复制 `.env.example` 为 `.env`
   - 填写 `SUPABASE_URL` 与 `SUPABASE_KEY`，可选设置 `PORT`
   - 若部署到 Vercel，建议在 Supabase 创建公开存储桶 `uploads`，并在环境变量中设置 `SUPABASE_STORAGE_BUCKET=uploads`
3. 初始化数据表
   - 将 `create_table.sql` 中的 SQL 在 Supabase 控制台或 SQL 编辑器执行
4. 本地启动
   - `npm start`
   - 访问 `http://localhost:3001`

## API

- `GET /api/records` 支持 `?date=YYYY-MM-DD` 与 `?keyword=关键字`
- `POST /api/records` body: `{ type: "text"|"image"|"voice", content, description? }`
- `DELETE /api/records/:id`
- `POST /api/upload` 表单字段 `image`，返回文件名

## 表结构（Supabase）

见 `create_table.sql`，包含字段：
- `id` 主键
- `type` 记录类型
- `content` 内容或图片文件名
- `description` 描述
- `timestamp` 时间戳

## 开发说明

- 静态资源目录：`public/`，图片上传目录：`public/uploads/`
- 环境变量通过 `dotenv` 加载，`.env` 文件已在 `.gitignore` 中忽略
- 推荐在 Supabase 启用 RLS 并按需配置策略

## CI

仓库内已配置 GitHub Actions：
- 自动安装依赖
- 自动检测并执行存在的 `lint`/`test`/`build` 脚本（若未配置相应脚本则跳过）

## Vercel 部署

- 已包含 `vercel.json`，将所有 `/api/*` 路由交由 `api/index.js` 处理，并将静态资源映射到 `public/`
- 在 Vercel 项目设置中添加环境变量：
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `SUPABASE_STORAGE_BUCKET`（例如 `uploads`）
- 服务端上传在 Vercel 上使用 Supabase Storage 存储，返回可公开访问的图片 URL
