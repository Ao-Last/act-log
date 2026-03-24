# Act Log

每 25 分钟弹窗一次，问你：*刚才在做什么？*

一个极简的桌面应用，帮你打破拖延和分析瘫痪，通过诚实的记录建立自我觉察。

[English](./README_EN.md)

## 怎么用

1. Act Log 安静地运行在系统托盘
2. 每 25 分钟弹出一个小窗口
3. 写下你刚才在做的事，按回车
4. 就这样。你的活动会带时间戳自动记录。

## 功能

- **定时弹窗** — 每 25 分钟温和提醒
- **日志查看器** — 按日期浏览历史记录，支持搜索
- **主题切换** — 6 种主题色，随时切换
- **中英双语** — 自动检测系统语言
- **轻量运行** — 常驻系统托盘，没有主窗口

## 下载

前往 [Releases](https://github.com/Ao-Last/act-log/releases) 下载最新的 `.dmg` 文件。目前仅支持 macOS (Apple Silicon)。

## 数据存储

日志以 `.jsonl` 格式存储在本地：

```
~/Library/Application Support/act-log/action_log.jsonl
```

每行一条 JSON 记录：

```json
{"timestamp":"2025-10-04T08:30:00.000Z","action":"完成了需求文档初稿"}
{"timestamp":"2025-10-04T09:00:00.000Z","action":"修复了登录页面的 bug"}
```

可以用任何你喜欢的工具分析。

## License

MIT
