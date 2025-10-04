# Act Log - 行动日志

一款极简的桌面应用，通过定时弹窗记录帮助你打破"分析瘫痪"和拖延，专注于"即刻行动"和自我觉察。

A minimalist desktop application that helps you overcome analysis paralysis and procrastination through timed activity logging, focusing on immediate action and self-awareness.

## ✨ 特性 (Features)

### 核心功能 (Core Features)

- **🕒 后台定时器** - 默认每25分钟静默运行的后台定时器
- **💬 强制弹窗** - 周期结束时自动弹出简洁的记录窗口，置顶显示
- **📝 快速记录** - 单行输入框，支持回车提交，ESC关闭
- **💾 结构化存储** - 使用JSON Lines (.jsonl)格式，易于解析和迁移
- **📊 日志查看器** - 美观的时间线界面，支持搜索和实时更新
- **🎯 系统托盘** - 常驻系统托盘，提供快捷控制菜单

### 系统托盘菜单 (System Tray Menu)

- **暂停/继续计时** - 暂时停止或恢复定时器
- **立即记录** - 手动触发记录弹窗（用于测试或即时记录）
- **查看日志** - 打开漂亮的日志查看器界面，浏览所有历史记录
- **打开日志文件** - 使用默认文本编辑器查看原始 JSON Lines 文件
- **开发模式: 3秒** - 🔧 仅在开发环境显示，启用后定时器间隔变为3秒，方便快速测试
- **退出** - 关闭应用

## 🚀 快速开始 (Quick Start)

### 安装依赖 (Install Dependencies)

```bash
npm install
```

### 开发模式 (Development)

```bash
npm run dev
```

### 构建应用 (Build Application)

```bash
# 构建所有平台
npm run build

# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## 📦 技术栈 (Tech Stack)

- **核心框架** - Electron + React + TypeScript
- **构建工具** - Vite + electron-vite
- **UI样式** - TailwindCSS v4
- **存储格式** - JSON Lines (.jsonl)

## 📊 日志查看器 (Log Viewer)

### 功能特性

- **🎨 美观界面** - 现代化设计，按日期分组显示
- **🔍 实时搜索** - 快速过滤查找特定记录
- **📈 统计信息** - 显示总记录数和累计时间
- **🔄 实时更新** - 新记录自动刷新显示
- **📅 时间线视图** - 按日期倒序，最新的在上面

### 使用方法

1. 右键点击系统托盘图标
2. 选择 **"查看日志 (View Logs)"**
3. 浏览你的所有活动记录
4. 使用搜索框快速查找

## 📁 数据存储 (Data Storage)

日志文件存储在用户数据目录：

- **macOS**: `~/Library/Application Support/act-log/action_log.jsonl`
- **Windows**: `%APPDATA%/act-log/action_log.jsonl`
- **Linux**: `~/.config/act-log/action_log.jsonl`

### 日志格式 (Log Format)

每一行都是一个独立的JSON对象：

```jsonl
{"timestamp":"2025-10-04T08:30:00.000Z","action":"完成了产品需求文档的初稿"}
{"timestamp":"2025-10-04T09:00:00.000Z","action":"修复了登录页面的UI bug"}
{"timestamp":"2025-10-04T09:30:00.000Z","action":"参加了团队站会，讨论了sprint计划"}
```

## ⚙️ 配置 (Configuration)

### 修改定时器周期 (Change Timer Interval)

编辑 `src/main/index.ts`：

```typescript
const TIMER_INTERVAL = 25 * 60 * 1000 // 25分钟，单位：毫秒
```

## 🎨 界面设计 (UI Design)

### 弹窗窗口 (Popup Window)

- 无边框设计，现代简洁
- 始终置顶，不在任务栏显示
- 渐变背景，柔和视觉体验
- 双语提示，中英文支持
- 自动聚焦输入框
- 支持键盘快捷键（Enter提交，Esc关闭）

## 🛠️ 开发说明 (Development Notes)

### 项目结构 (Project Structure)

```
act-log/
├── src/
│   ├── main/           # 主进程
│   │   └── index.ts    # 核心逻辑：定时器、托盘、日志、窗口管理
│   ├── preload/        # 预加载脚本
│   │   ├── index.ts    # IPC通信桥接
│   │   └── index.d.ts  # TypeScript类型定义
│   └── renderer/       # 渲染进程
│       ├── index.html  # 主窗口（未使用）
│       ├── popup.html  # 弹窗页面
│       ├── viewer.html # 日志查看器页面
│       └── src/
│           ├── popup.tsx           # 弹窗入口
│           ├── viewer.tsx          # 查看器入口
│           ├── components/
│           │   ├── Popup.tsx       # 弹窗UI组件
│           │   └── LogViewer.tsx   # 日志查看器组件
│           └── assets/
│               └── popup.css       # TailwindCSS样式
├── electron.vite.config.ts  # Vite配置（多页面入口）
├── package.json
└── README.md
```

### IPC通信 (IPC Communication)

**渲染进程 → 主进程：**

- `submit-log` - 提交记录内容
- `close-popup` - 关闭弹窗
- `get-logs` - 获取所有日志记录（返回Promise）
- `close-viewer` - 关闭日志查看器

**主进程 → 渲染进程：**

- `logs-updated` - 通知日志查看器有新记录

### 关键技术点 (Key Technical Points)

1. **TailwindCSS v4** - 使用 `@tailwindcss/postcss` 插件
2. **多页面应用** - 通过 `electron.vite.config.ts` 配置多个HTML入口
3. **系统托盘** - macOS使用菜单栏图标，Windows/Linux使用系统托盘
4. **后台运行** - 关闭所有窗口后应用仍在后台运行

## 📝 使用建议 (Usage Tips)

1. **首次使用** - 启动后应用会在系统托盘显示图标
2. **快速测试（开发）** - 启用"开发模式: 3秒"选项，定时器间隔变为3秒，方便快速测试核心功能
3. **即时记录** - 右键托盘图标，点击"立即记录"手动触发弹窗
4. **暂停计时** - 临时有事可以暂停，避免不必要的打断
5. **查看日志** - 点击"打开日志文件"查看所有历史记录
6. **数据分析** - .jsonl格式便于用Python/JavaScript等工具分析

### 🔧 开发模式测试流程

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在系统托盘右键菜单中勾选 "开发模式: 3秒"
# 3. 等待3秒，弹窗会自动出现
# 4. 输入测试内容，按 Enter 提交
# 5. 再等待3秒，下一个弹窗出现
# 6. 测试完成后，取消勾选开发模式，恢复为25分钟间隔
```

> 💡 **开发模式选项仅在 `npm run dev` 时显示，生产环境不会出现**

## 🎯 设计理念 (Design Philosophy)

> "行动大于完美" - Action over perfection

这个应用的目标不是成为一个功能完备的任务管理器，而是：

- ✅ 最小化干扰，最大化觉察
- ✅ 强制输出，打破思维循环
- ✅ 简单记录，降低心理负担
- ✅ 结构化数据，方便后期分析
- ✅ 美观界面，提升查看体验

## 📄 License

MIT

## 🤝 Contributing

欢迎提交 Issue 和 Pull Request！

---

**Built with ❤️ using Electron + React + TypeScript + TailwindCSS v4**
