# 短剧 CPS 多 Facebook 主页自然流量发布与数据追踪系统

## 项目简介

这是一个用于管理多个 Facebook 主页，发布短剧视频并追踪 CPS 转化数据的全栈 Web 系统。

### 核心功能

1. **多主页管理** - 管理多个 Facebook Page，支持授权、健康监控
2. **素材库管理** - 上传和管理短剧视频、封面、CPS 链接
3. **变体生成** - 为同一视频创建多个发布变体（标题、正文、CTA等）
4. **智能排期** - 支持错峰发布，避免主页风险
5. **数据追踪** - 播放量、互动数、点击、转化、收入统计
6. **CPS 跳转** - 中转链接追踪，记录点击日志
7. **风控规则** - 主页健康分、发布限制、自动暂停
8. **任务队列** - BullMQ 实现定时发布和数据同步

### 技术栈

- **前端**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Next.js API Routes, Prisma ORM, PostgreSQL
- **队列**: BullMQ + Redis
- **存储**: S3/R2/本地存储抽象层
- **认证**: NextAuth.js

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

### 3. 数据库设置

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库结构
npm run db:push

# 或运行迁移
npm run db:migrate

# 种子数据（可选）
npm run db:seed
```

### 4. 启动服务

```bash
# 启动开发服务器
npm run dev

# 启动任务队列 Worker（新终端）
npm run worker:all
```

### 5. 访问系统

- 前台: http://localhost:3000
- Prisma Studio: http://localhost:5555

## 目录结构

```
drama-cps-tracker/
├── prisma/
│   ├── schema.prisma          # 数据库模型
│   └── seed.ts                # 种子数据
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── (dashboard)/       # 后台管理页面
│   │   ├── api/               # API 路由
│   │   └── go/                # CPS 跳转追踪
│   ├── components/            # React 组件
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── layout/            # 布局组件
│   │   └── business/          # 业务组件
│   ├── lib/                   # 工具函数
│   ├── services/              # 服务层
│   │   ├── meta/              # Meta API 封装
│   │   ├── queue/             # BullMQ 队列
│   │   └── storage/           # 存储服务
│   ├── workers/               # 后台任务 Worker
│   └── types/                 # TypeScript 类型定义
├── public/                    # 静态资源
└── uploads/                   # 本地上传目录（开发用）
```

## Meta API 配置

### 创建 Facebook App

1. 访问 [Meta for Developers](https://developers.facebook.com/)
2. 创建新应用，选择"企业"类型
3. 添加"Facebook Login"和"Pages API"产品
4. 获取 App ID 和 App Secret

### 获取 Page Access Token

系统支持两种方式获取 Page Token：

1. **手动添加** - 用户自行获取并粘贴 Token
2. **OAuth 授权** - 通过 Facebook Login 流程获取（推荐）

### 所需权限

- `pages_manage_posts` - 发布内容
- `pages_read_engagement` - 读取互动数据
- `pages_read_user_content` - 读取主页内容
- `pages_show_list` - 显示主页列表

## 风控规则

1. **每日发布限制** - 每个主页每天不超过设定上限
2. **错峰发布** - 同一视频在不同主页间隔 15-90 分钟
3. **去重检查** - 同一主页不重复发布同一变体
4. **失败暂停** - 连续失败 3 次自动暂停主页
5. **健康分机制** - 根据发布情况动态调整健康分

## 部署建议

### 生产环境

1. **数据库**: PostgreSQL 14+（推荐 Supabase、Neon、Railway）
2. **Redis**: Redis 7+（推荐 Upstash、Railway）
3. **存储**: Cloudflare R2 或 AWS S3
4. **部署**: Vercel（前端）+ Railway/Render（Worker）

### 环境变量

详见 `.env.example` 文件。

## 后续扩展

- [ ] AI 文案生成（集成 OpenAI/Claude）
- [ ] AI 封面生成（集成 DALL-E/Midjourney）
- [ ] 自动放量和 A/B 测试
- [ ] 多语言支持
- [ ] 团队权限管理
- [ ] 更详细的分析报表
- [ ] Webhook 集成（CPS 平台回传）
- [ ] 自动标签推荐

## License

MIT