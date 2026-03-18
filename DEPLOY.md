# HYROX Advance - Vercel 部署指南

> 🏃 HYROX 进阶 - AI 成绩分析与训练指导平台

---

## 📋 部署概述

本项目支持两种部署模式：

1. **纯静态部署** (当前配置) - 仅部署前端，API 功能受限
2. **全栈部署** - 需要服务器环境，支持完整 API 功能

> ⚠️ **注意**: 由于项目使用 Node.js + Express 后端 + SQLite 数据库，**纯静态托管无法支持完整的 API 功能**。推荐部署到支持 Node.js 的服务器或 Vercel Pro 的 Serverless 方案。

---

## 🚀 快速部署 (静态前端)

### 1. 准备工作

确保你已安装：
- [Node.js](https://nodejs.org/) 18+
- [Vercel CLI](https://vercel.com/docs/cli) (可选)

```bash
# 安装 Vercel CLI (可选)
npm i -g vercel
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd hyrox-advance
```

### 3. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装客户端依赖
cd client && npm install
cd ..
```

### 4. 构建前端

```bash
npm run build:client
```

---

## 🌐 部署到 Vercel

### 方式一：Vercel Dashboard (推荐)

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 Git 仓库
   - 选择 "hyrox-advance" 项目

3. **配置构建设置**
   - **Framework Preset**: `Other`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 访问分配的域名

### 方式二：Vercel CLI

```bash
# 登录 Vercel
vercel login

# 部署 (预览)
vercel

# 生产部署
vercel --prod
```

---

## ⚙️ 环境变量配置

### 前端环境变量

在 Vercel Dashboard 中配置：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-api-domain.com/api` | 后端 API 地址 |

### 完整功能部署 (需要后端)

如需完整 API 功能，需要额外部署后端服务器：

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | 服务器端口 |
| `DASHSCOPE_API_KEY` | ✅ | DashScope API 密钥 |
| `DATABASE_PATH` | 可选 | SQLite 数据库路径 |

---

## 🔧 项目结构

```
hyrox-advance/
├── client/                    # 前端 (React + Vite)
│   ├── dist/                  # 构建输出目录
│   ├── src/                   # 源代码
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                    # 后端 (Express)
│   ├── index.ts               # 服务器入口
│   ├── routes/                # API 路由
│   └── lib/                   # 工具库
├── api/                       # Vercel Serverless Functions
│   └── index.ts               # API 入口
├── vercel.json                # Vercel 配置
├── .env.production            # 环境变量模板
├── package.json               # 根项目配置
└── DEPLOY.md                  # 本文件
```

---

## 📝 已知问题

### 问题 1: API 功能受限

**现象**: 部署后 AI 分析、训练计划生成功能无法使用

**原因**: Vercel 静态托管不支持 Node.js 后端和 SQLite 数据库

**解决方案**:
1. **方案 A**: 部署到支持 Node.js 的服务器 (推荐)
   - 使用 VPS (阿里云、腾讯云等)
   - 使用 Railway、Render 等平台

2. **方案 B**: 分离前后端部署
   - 前端: Vercel 静态托管
   - 后端: 部署到支持 Node.js 的服务器

3. **方案 C**: 使用 Vercel Pro + Serverless Functions
   - 需要改造数据库使用外部服务 (如 PlanetScale、Supabase)

### 问题 2: 构建失败

**现象**: Vercel 构建过程报错

**解决方案**:
```bash
# 本地测试构建
npm run build:client

# 检查错误输出并修复
```

### 问题 3: 页面刷新后 404

**现象**: 直接访问 `/analysis` 等路由返回 404

**解决方案**: 已在 `vercel.json` 中配置路由重写，确保所有路由指向 `index.html`

---

## 🏗️ 完整功能部署方案

### 推荐架构

```
┌─────────────────┐      ┌──────────────────┐
│   Vercel        │      │   VPS/Server     │
│   (静态前端)     │◄────►│   (Node.js API)  │
│   client/dist   │      │   + SQLite       │
└─────────────────┘      └──────────────────┘
```

### 后端部署步骤

1. **准备服务器**
   - 购买 VPS (推荐 1核2G 起步)
   - 安装 Node.js 18+

2. **上传代码**
```bash
# 在服务器上
git clone <your-repo>
cd hyrox-advance
npm install
```

3. **配置环境变量**
```bash
cp .env.production .env
# 编辑 .env 填入实际值
```

4. **构建并启动**
```bash
npm run build
npm start
```

5. **配置 Nginx 反向代理** (推荐)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔍 调试与日志

### 查看 Vercel 日志

1. 在 Vercel Dashboard 中选择项目
2. 点击 "Deployments" 标签
3. 选择最近的部署
4. 点击 "View Logs"

### 本地调试

```bash
# 开发模式
npm run dev

# 客户端开发服务器
cd client && npm run dev
```

---

## 🔄 持续部署

配置 Git 集成后：

1. 推送代码到主分支
2. Vercel 自动触发构建
3. 构建成功后自动部署
4. 预览部署可在 PR 中查看

---

## 📚 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Node.js 运行时](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [DashScope 文档](https://help.aliyun.com/document_detail/2586404.html)
- [项目 README](./README.md)

---

## 💡 部署检查清单

### 静态部署 (Vercel)
- [ ] `vercel.json` 配置正确
- [ ] `client/dist` 目录在构建后存在
- [ ] 所有路由指向 `index.html`

### 完整功能部署
- [ ] 后端服务器已部署
- [ ] 环境变量已配置 (DASHSCOPE_API_KEY)
- [ ] 数据库可写入
- [ ] Nginx 反向代理配置正确
- [ ] HTTPS 已启用

---

## 🆘 获取帮助

遇到问题？

1. 检查 [已知问题](#已知问题) 部分
2. 查看 Vercel 构建日志
3. 本地测试构建是否成功
4. 确认环境变量配置正确

---

**注意**: 本项目当前配置为静态前端部署。如需完整功能，请按照 [完整功能部署方案](#完整功能部署方案) 部署后端服务器。
