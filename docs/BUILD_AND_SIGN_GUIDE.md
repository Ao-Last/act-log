# macOS 打包、签名和公证指南

## 📋 目录

- [前置要求](#前置要求)
- [需要准备的信息](#需要准备的信息)
- [步骤1：获取证书](#步骤1获取证书)
- [步骤2：配置环境变量](#步骤2配置环境变量)
- [步骤3：更新配置文件](#步骤3更新配置文件)
- [步骤4：构建和打包](#步骤4构建和打包)
- [常见问题](#常见问题)

---

## 前置要求

### ✅ 必须具备
1. **Apple Developer 账号**（个人或组织账号均可）
2. **付费订阅有效**（$99/年）
3. **在 macOS 系统上进行打包**（需要访问 Keychain）
4. **Xcode 或 Xcode Command Line Tools** 已安装

### 检查 Xcode Command Line Tools
```bash
xcode-select --install
# 如果已安装会提示：command line tools are already installed
```

---

## 需要准备的信息

### 1. Apple ID 和 App-Specific Password

#### Apple ID
你用于登录 Apple Developer 的邮箱地址。

#### 生成 App-Specific Password（应用专用密码）

**重要：** 不能使用你的 Apple ID 密码，必须生成一个应用专用密码用于公证。

**步骤：**
1. 访问 [Apple ID 管理页面](https://appleid.apple.com/)
2. 登录你的 Apple ID
3. 在"安全"部分找到"应用专用密码"
4. 点击"生成密码..."
5. 输入标签名称（如：`Act Log Notarization`）
6. 记录生成的密码（格式：`xxxx-xxxx-xxxx-xxxx`）

**⚠️ 重要：** 生成后立即保存这个密码，因为它只会显示一次！

---

### 2. Team ID

**获取方式：**
1. 访问 [Apple Developer Membership](https://developer.apple.com/account#MembershipDetailsCard)
2. 登录后在"Membership details"中找到 **Team ID**
3. 格式示例：`A1B2C3D4E5`（10位字母数字组合）

---

### 3. Developer ID Application 证书

这是用于签名应用的证书。

#### 创建证书（如果还没有）

**步骤：**
1. 访问 [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
2. 点击 "+" 创建新证书
3. 选择 **"Developer ID Application"**
4. 按照提示生成 CSR（Certificate Signing Request）：
   ```bash
   # 在 macOS 上打开 Keychain Access（钥匙串访问）
   # 菜单栏 → 钥匙串访问 → 证书助理 → 从证书颁发机构请求证书
   # 填写信息：
   # - 用户电子邮件地址：你的邮箱
   # - 常用名称：你的名字或公司名
   # - 请求是：保存到磁盘
   ```
5. 上传生成的 CSR 文件
6. 下载证书（.cer 文件）
7. 双击安装到 Keychain

#### 查看已安装的证书
```bash
# 在终端运行，查看所有可用的签名证书
security find-identity -v -p codesigning
```

输出示例：
```
1) ABCDEF1234567890 "Developer ID Application: Your Name (TEAMID123)"
```

记录证书的**完整名称**，例如：`Developer ID Application: Your Name (TEAMID123)`

---

### 4. 应用信息

#### App ID (Bundle Identifier)
建议格式：`com.yourcompany.actlog`

**示例：**
- `com.yourname.actlog`
- `com.github.yourusername.actlog`

**注意：** 
- 必须是反向域名格式
- 只能包含字母、数字、连字符和点
- 不能以数字开头

---

## 步骤1：获取证书

### 验证证书已正确安装

运行以下命令查看可用的签名证书：

```bash
security find-identity -v -p codesigning
```

你应该看到类似输出：
```
1) ABCDEF1234567890 "Developer ID Application: Your Name (TEAMID123)"
```

如果没有看到任何证书，请按照上面的步骤创建和安装证书。

---

## 步骤2：配置环境变量

创建或编辑你的环境配置文件（`~/.zshrc` 或 `~/.bash_profile`），添加以下内容：

```bash
# Apple Developer 配置
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="A1B2C3D4E5"
```

**替换为你的实际信息：**
- `APPLE_ID`: 你的 Apple ID 邮箱
- `APPLE_APP_SPECIFIC_PASSWORD`: 步骤1中生成的应用专用密码
- `APPLE_TEAM_ID`: 你的 Team ID

**保存后重新加载配置：**
```bash
source ~/.zshrc
# 或
source ~/.bash_profile
```

**验证环境变量：**
```bash
echo $APPLE_ID
echo $APPLE_APP_SPECIFIC_PASSWORD
echo $APPLE_TEAM_ID
```

---

## 步骤3：更新配置文件

### 3.1 更新 `package.json`

修改应用信息：

```json
{
  "name": "act-log",
  "version": "1.0.0",
  "description": "Activity Logger - Track your actions every 25 minutes",
  "author": "Your Name <your-email@example.com>",
  "homepage": "https://github.com/yourusername/act-log"
}
```

### 3.2 更新 `electron-builder.yml`

文件已经配置好了，你只需要确认以下几点：

1. **appId** 已经设置为合适的值
2. **签名证书名称** 正确（会自动从 Keychain 读取）
3. **公证配置** 已启用

配置文件中的关键部分：
```yaml
appId: com.yourcompany.actlog  # 你的 App ID
productName: Act Log

mac:
  # 只构建 arm64 版本
  target:
    - target: dmg
      arch: arm64
  
  # 应用图标
  icon: build/icon.icns
  
  # 应用类别
  category: public.app-category.productivity
  
  # 签名配置
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  
  # 公证配置
  notarize:
    teamId: ${APPLE_TEAM_ID}

dmg:
  title: Act Log ${version}
  icon: build/icon.icns
  background: null
  window:
    width: 540
    height: 380
  contents:
    - x: 144
      y: 180
    - x: 396
      y: 180
      type: link
      path: /Applications
```

---

## 步骤4：构建和打包

### 4.1 清理之前的构建
```bash
rm -rf dist out
```

### 4.2 执行打包
```bash
npm run build:mac:arm64
```

### 打包过程

打包过程会自动执行以下步骤：

1. **编译代码** - TypeScript → JavaScript
2. **代码签名** - 使用 Developer ID Application 证书签名
3. **创建 DMG** - 打包成可分发的 DMG 文件
4. **公证** - 上传到 Apple 进行公证
5. **Stapling** - 将公证票据附加到 DMG

**完整过程可能需要 5-15 分钟**，主要时间花在公证步骤。

### 4.3 打包输出

成功后，你会在 `dist/` 目录下找到：

```
dist/
├── Act Log-1.0.0-arm64-mac.zip          # 压缩包（用于分发）
├── Act Log-1.0.0-arm64.dmg              # DMG 安装文件（主要分发文件）
├── mac-arm64/
│   └── Act Log.app                       # 应用程序包
└── builder-debug.yml                     # 构建调试信息
```

---

## 验证签名和公证

### 验证代码签名
```bash
codesign -dv --verbose=4 "dist/mac-arm64/Act Log.app"
```

应该看到：
```
Authority=Developer ID Application: Your Name (TEAMID)
Authority=Developer ID Certification Authority
Authority=Apple Root CA
```

### 验证公证状态
```bash
spctl -a -vv "dist/mac-arm64/Act Log.app"
```

成功的输出：
```
dist/mac-arm64/Act Log.app: accepted
source=Notarized Developer ID
```

### 验证 DMG
```bash
spctl -a -t open --context context:primary-signature -v "dist/Act Log-1.0.0-arm64.dmg"
```

---

## 分发应用

### 分发文件
使用 **`Act Log-1.0.0-arm64.dmg`** 文件进行分发。

### 用户安装
1. 下载 DMG 文件
2. 双击打开
3. 拖动 "Act Log.app" 到 Applications 文件夹
4. 首次打开可能需要在"系统偏好设置" → "安全性与隐私"中允许

---

## 常见问题

### 1. 找不到签名证书

**问题：** `Error: Cannot find Developer ID Application certificate`

**解决方案：**
```bash
# 检查证书
security find-identity -v -p codesigning

# 如果没有证书，需要从 Apple Developer 下载并安装
# 参见"步骤1：获取证书"
```

### 2. 公证失败

**问题：** `Error: Notarization failed`

**常见原因：**
- Apple ID 或密码错误
- Team ID 错误
- 应用包含不符合规范的代码

**解决方案：**
```bash
# 验证环境变量
echo $APPLE_ID
echo $APPLE_APP_SPECIFIC_PASSWORD
echo $APPLE_TEAM_ID

# 查看详细的公证日志
# 日志会在构建输出中显示
```

### 3. 应用无法打开（"已损坏"提示）

**问题：** 用户下载后提示"应用已损坏"

**原因：** 没有正确公证或 Stapling 失败

**解决方案：**
```bash
# 验证公证状态
spctl -a -vv "dist/mac-arm64/Act Log.app"

# 如果未公证，需要重新打包
```

### 4. 环境变量不生效

**问题：** 打包时提示缺少 Apple ID 等信息

**解决方案：**
```bash
# 确认环境变量已加载
source ~/.zshrc

# 或者直接在命令行设置
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="A1B2C3D4E5"

# 然后执行打包
npm run build:mac:arm64
```

### 5. 签名证书过期

**问题：** `Error: Certificate has expired`

**解决方案：**
1. 访问 [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates/list)
2. 撤销旧证书
3. 创建新的 Developer ID Application 证书
4. 下载并安装到 Keychain
5. 重新打包

---

## 快速检查清单

打包前确认以下项目：

- [ ] Apple Developer 账号有效且付费
- [ ] 已安装 Developer ID Application 证书
- [ ] 已设置环境变量（APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID）
- [ ] 已更新 `package.json` 中的应用信息
- [ ] 已更新 `electron-builder.yml` 中的 appId
- [ ] 在 macOS 上执行打包

---

## 自动化脚本

为了方便，可以创建一个打包脚本：

```bash
#!/bin/bash
# build-mac.sh

echo "🚀 开始构建 Act Log for macOS (arm64)..."

# 检查环境变量
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ 错误：缺少必要的环境变量"
    echo "请设置："
    echo "  - APPLE_ID"
    echo "  - APPLE_APP_SPECIFIC_PASSWORD"
    echo "  - APPLE_TEAM_ID"
    exit 1
fi

echo "✅ 环境变量检查通过"

# 清理旧的构建
echo "🧹 清理旧的构建文件..."
rm -rf dist out

# 执行打包
echo "📦 开始打包..."
npm run build:mac:arm64

if [ $? -eq 0 ]; then
    echo "✅ 打包成功！"
    echo "📦 输出文件："
    ls -lh dist/*.dmg dist/*.zip 2>/dev/null
else
    echo "❌ 打包失败"
    exit 1
fi
```

使用方法：
```bash
chmod +x build-mac.sh
./build-mac.sh
```

---

## 进一步阅读

- [Electron Builder 文档](https://www.electron.build/)
- [Apple 代码签名指南](https://developer.apple.com/support/code-signing/)
- [Apple 公证指南](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

---

## 需要帮助？

如果遇到问题，请检查：
1. 构建输出日志
2. `dist/builder-debug.yml` 文件
3. Apple Developer 账号状态
4. 证书有效期

祝打包顺利！🎉


