# 主题配置说明 (Theme Configuration Guide)

## 功能概述

Act Log 现已支持可配置的主题色系统。您可以从多个预设主题中选择，应用会自动更新所有界面元素的颜色。

## 可用主题

1. **靛蓝 (Indigo)** - 默认主题，温和优雅的紫蓝色
2. **蓝色 (Blue)** - 清新明亮的天蓝色
3. **翡翠绿 (Emerald)** - 活力清新的绿色
4. **玫瑰红 (Rose)** - 温暖柔和的红色
5. **紫罗兰 (Violet)** - 神秘优雅的紫色
6. **琥珀色 (Amber)** - 温暖醒目的橙黄色

## 如何使用

### 更改主题

1. 点击菜单栏中的系统托盘图标
2. 选择"主题 (Theme)"菜单项
3. 从子菜单中选择您喜欢的主题色
4. 应用会立即应用新主题到所有界面

### 主题应用范围

主题色会应用到以下界面元素：

- **系统托盘图标**: 进度环的颜色会随主题变化
- **弹出窗口**: 输入框焦点状态和提交按钮
- **日志查看器**: 搜索框焦点、日期标记圆点、时间标签背景

### 主题持久化

选择的主题会自动保存，下次启动应用时会继续使用您上次选择的主题。

## 技术实现

主题系统使用以下技术实现：

- `electron-store`: 持久化存储用户的主题选择
- CSS 变量: 动态应用主题色到界面元素
- IPC 通信: 主进程和渲染进程间同步主题状态
- Canvas: 动态生成带有主题色的托盘图标

## 自定义主题

如果您想添加自定义主题色，可以编辑 `src/main/index.ts` 文件中的 `THEMES` 对象：

```typescript
const THEMES: Record<string, Theme> = {
  // ... existing themes
  custom: {
    name: 'custom',
    primary: '#YOUR_PRIMARY_COLOR',      // 主色调
    primaryLight: '#YOUR_LIGHT_COLOR',   // 浅色变体
    primaryDark: '#YOUR_DARK_COLOR',     // 深色变体
    displayName: '自定义名称 (Custom)'
  }
}
```

然后重新构建应用即可。

