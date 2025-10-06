# 多语言支持指南 (i18n Guide)

## 概述 (Overview)

本项目使用 `i18next` 和 `react-i18next` 实现了完整的多语言支持系统。这是 React 生态中最成熟、最可扩展的国际化解决方案。

## 技术栈 (Tech Stack)

- **i18next**: 核心国际化框架
- **react-i18next**: React 集成库
- **localStorage**: 用户语言偏好持久化

## 项目结构 (Project Structure)

```
src/renderer/src/
├── i18n/
│   └── index.ts           # i18next 配置和初始化
├── locales/
│   ├── en.json            # 英文翻译
│   └── zh.json            # 中文翻译
└── components/
    └── LanguageSwitcher.tsx  # 语言切换组件
```

## 配置说明 (Configuration)

### i18n 初始化配置

配置文件位于 `src/renderer/src/i18n/index.ts`：

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: getSavedLanguage(),  // 从 localStorage 加载或使用系统语言
    fallbackLng: 'en',         // 默认回退语言
    interpolation: {
      escapeValue: false       // React 已经处理了 XSS 防护
    }
  })
```

### 语言检测逻辑

系统会按以下优先级检测语言：
1. 用户之前保存的语言偏好（localStorage）
2. 浏览器/系统语言
3. 默认回退到英文

### 语言持久化

当用户切换语言时，偏好会自动保存到 `localStorage`：

```typescript
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app-language', lng)
})
```

## 翻译文件结构 (Translation File Structure)

翻译文件使用 JSON 格式，采用命名空间组织：

```json
{
  "logViewer": {
    "title": "Activity Log",
    "totalRecords": "{{count}} records",
    "timeUnits": {
      "minutes": "{{count}} minutes"
    }
  },
  "popup": {
    "title": "What did you accomplish?",
    "submitButton": "Log It"
  }
}
```

### 命名空间说明

- `logViewer`: 日志查看器界面相关文本
- `popup`: 快速输入弹窗相关文本
- `settings`: 设置相关文本
- `common`: 通用文本（按钮、确认等）

## 语言切换 (Switching Languages)

### 用户视角

有两种方式可以切换语言：

#### 方法一：通过系统托盘（推荐）

1. 右键点击系统托盘图标
2. 选择 **"语言 (Language)"** 菜单项
3. 选择你想要的语言：
   - **自动（跟随系统）** - 根据系统语言自动选择
   - **中文** - 简体中文
   - **English** - 英文
4. 立即生效！托盘菜单和所有窗口自动更新

#### 方法二：在日志查看器中

1. 打开日志查看器
2. 点击右上角的语言切换按钮
3. 选择语言
4. 立即生效！

### 技术实现

语言切换通过主进程和渲染进程同步实现：

```typescript
// 在渲染进程中切换语言
window.api.setLanguage('zh') // 或 'en' 或 'auto'

// 主进程会：
// 1. 更新 electron-store 中的语言设置
// 2. 更新托盘菜单显示
// 3. 通知所有窗口语言已更改

// 渲染进程监听语言变化
window.api.onLanguageChanged((lang) => {
  i18n.changeLanguage(lang)
})
```

## 在组件中使用 (Usage in Components)

### 基本使用

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('logViewer.title')}</h1>
    </div>
  )
}
```

### 带参数的翻译

```typescript
// 翻译文件中: "totalRecords": "共 {{count}} 条记录"
const { t } = useTranslation()
<p>{t('logViewer.totalRecords', { count: 42 })}</p>
// 输出: "共 42 条记录"
```

### 访问当前语言

```typescript
const { i18n } = useTranslation()
const currentLang = i18n.language  // 'zh' 或 'en'
```

### 动态切换语言

```typescript
const { i18n } = useTranslation()
i18n.changeLanguage('en')  // 切换到英文
```

## 添加新语言 (Adding New Languages)

### 1. 创建翻译文件

在 `src/renderer/src/locales/` 目录下创建新的 JSON 文件，例如 `ja.json`（日语）：

```json
{
  "logViewer": {
    "title": "アクティビティログ",
    "totalRecords": "{{count}} 件の記録",
    ...
  }
}
```

### 2. 更新 i18n 配置

编辑 `src/renderer/src/i18n/index.ts`：

```typescript
import ja from '../locales/ja.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja }  // 添加新语言
    },
    // ...
  })
```

### 3. 更新语言切换器

编辑 `src/renderer/src/components/LanguageSwitcher.tsx`：

```typescript
const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' }  // 添加新语言
]
```

### 4. 更新语言检测逻辑（可选）

如果需要自动检测新语言，更新 `getSavedLanguage()` 函数：

```typescript
const getSavedLanguage = (): string => {
  const savedLang = localStorage.getItem('app-language')
  if (savedLang) return savedLang

  const browserLang = navigator.language.toLowerCase()
  
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ja')) return 'ja'  // 添加日语检测
  
  return 'en'
}
```

## 最佳实践 (Best Practices)

### 1. 使用描述性的键名

❌ 不好：
```json
{
  "text1": "Hello",
  "btn": "Submit"
}
```

✅ 好：
```json
{
  "greeting": "Hello",
  "submitButton": "Submit"
}
```

### 2. 组织命名空间

将相关的翻译组织在同一命名空间下：

```json
{
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "register": "Register"
  }
}
```

### 3. 使用变量进行动态内容

❌ 不好：
```typescript
const text = count === 1 ? '1 record' : `${count} records`
```

✅ 好：
```json
{
  "recordCount": "{{count}} record",
  "recordCount_plural": "{{count}} records"
}
```

### 4. 保持所有语言文件同步

确保所有语言文件都有相同的键结构，避免缺失翻译。

### 5. 本地化日期和时间格式

根据当前语言使用合适的日期格式：

```typescript
const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US'
date.toLocaleDateString(locale, options)
```

## 测试 (Testing)

### 手动测试

1. 启动应用：`npm run dev`
2. 点击右上角的语言切换器
3. 切换不同语言，确认所有文本正确显示
4. 重启应用，确认语言偏好被保存

### 检查缺失的翻译

可以使用工具比较不同语言文件，确保所有键都存在：

```bash
# 比较两个 JSON 文件的键
diff <(jq -S 'paths(scalars) as $p | [$p] | join(".")' locales/en.json) \
     <(jq -S 'paths(scalars) as $p | [$p] | join(".")' locales/zh.json)
```

## 常见问题 (FAQ)

### Q: 如何处理复数形式？

A: i18next 支持复数规则：

```json
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items"
}
```

使用时：
```typescript
t('item', { count: 1 })  // "1 item"
t('item', { count: 5 })  // "5 items"
```

### Q: 如何处理长文本或 HTML 内容？

A: 使用 Trans 组件：

```typescript
import { Trans } from 'react-i18next'

<Trans i18nKey="welcomeMessage">
  Welcome to <strong>Act Log</strong>!
</Trans>
```

### Q: 语言切换后组件没有更新？

A: 确保：
1. 组件使用了 `useTranslation()` hook
2. i18n 在入口文件中正确初始化
3. 使用了 `t()` 函数而不是直接访问翻译对象

### Q: 如何在 Electron 主进程中使用 i18n？

A: 主进程需要单独配置 i18next。可以通过 IPC 通信从渲染进程获取当前语言，或者在主进程中独立初始化 i18next。

## 相关资源 (Resources)

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [i18next 最佳实践](https://www.i18next.com/principles/best-practices)

## 维护者 (Maintainers)

如有问题或建议，请提交 Issue 或 Pull Request。

