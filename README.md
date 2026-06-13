# 谜境推理 - 剧本杀桌游店管理系统

## 项目简介

全栈剧本杀桌游店管理系统，支持房间管理、剧本浏览、在线预约、组局邀请等功能。

## 技术栈

- **前端：** React 18 + TypeScript + Vite + React Router 6
- **后端：** Express + TypeScript + better-sqlite3 + JWT
- **样式：** 内联在 index.html 中的 CSS（暗色主题）

## 快速启动

```bash
# 安装所有依赖
npm run install:all

# 同时启动前后端
npm run dev
```

前端运行在 http://localhost:5173，后端运行在 http://localhost:3000。

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 店长 | admin  | 123456 |
| 玩家 | player | 123456 |

## 功能列表

### 玩家端
- 注册/登录
- 浏览房间列表，查看房间详情
- 预约房间（选日期、时段、剧本）
- 查看/取消我的预约
- 浏览剧本列表，查看剧本详情和玩家评价
- 对剧本进行评分和写短评
- 发起组局邀请，查看组局广场，报名加入组局

### 店长后台
- 创建/编辑房间（设置名称、人数、时长、价格、状态）
- 新增剧本
- 查看每日预约列表和房间使用率统计
- 按日期查看房间空闲/约满状态

## 项目结构

```
wje-145/
├── package.json              # 根目录，统一启动脚本
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express 入口
│       ├── db/database.ts    # 数据库初始化 + 种子数据
│       ├── middleware/auth.ts # JWT 认证中间件
│       └── routes/
│           ├── auth.ts       # 登录/注册/获取当前用户
│           ├── rooms.ts      # 房间 CRUD
│           ├── scripts.ts    # 剧本 CRUD + 评分
│           ├── bookings.ts   # 预约管理
│           └── groups.ts     # 组局管理
└── client/
    ├── package.json
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx           # 路由配置
        ├── api/index.ts      # API 封装 + 类型定义
        ├── components/
        │   ├── AuthProvider.tsx
        │   ├── Header.tsx
        │   └── Shared.tsx
        └── pages/
            ├── Login.tsx
            ├── RoomList.tsx
            ├── RoomDetail.tsx
            ├── ScriptList.tsx
            ├── ScriptDetail.tsx
            ├── GroupSquare.tsx
            ├── MyBookings.tsx
            ├── MyGroups.tsx
            └── AdminDashboard.tsx
```
