# CI/CD 说明

## GitHub Actions 工作流

本项目使用 GitHub Actions 自动构建和发布 Windows 版本的应用程序。

## 触发方式

### 1. Tag 触发（推荐用于正式发布）

当推送一个以 `v` 开头的 tag 时，自动触发构建并创建 Release：

```bash
# 创建并推送 tag
git tag v0.1.0
git push origin v0.1.0
```

这会：
1. 构建应用程序
2. 自动创建 GitHub Release
3. 上传安装包到 Release

### 2. 手动触发

访问 GitHub 仓库的 Actions 页面，选择 "Build and Release" 工作流，点击 "Run workflow" 按钮。

## 构建产物

构建完成后会生成以下文件：

- `teapot-windows-x64.exe` - NSIS 安装程序（推荐）
- `teapot-windows-x64.msi` - MSI 安装程序

## 产物下载

### 从 Actions 下载

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择最近的工作流运行
3. 在页面底部找到 **Artifacts** 部分
4. 下载 `teapot-windows-installer` 压缩包

### 从 Release 下载

如果是通过 tag 触发的构建，安装包会自动上传到 GitHub Releases：

1. 进入 GitHub 仓库的 **Releases** 标签页
2. 找到对应的版本
3. 下载 `.exe` 或 `.msi` 安装包

## 发布流程

### 发布新版本

```bash
# 1. 确保代码已提交
git add .
git commit -m "Release version x.x.x"

# 2. 推送到 main 分支
git push origin main

# 3. 创建版本 tag
git tag vx.y.z
git push origin vx.y.z
```

示例：
```bash
git tag v1.0.0
git push origin v1.0.0
```

## 工作流配置

工作流文件：`.github/workflows/build.yml`

### 主要步骤

1. **Checkout repository** - 检出代码
2. **Setup Rust** - 安装 Rust 工具链（Windows x86_64）
3. **Setup Node.js** - 安装 Node.js 20
4. **Cache** - 缓存依赖以加速构建
5. **Install dependencies** - 安装 npm 依赖
6. **Build frontend** - 构建前端资源
7. **Build Tauri** - 使用 Tauri Action 构建应用
8. **Rename artifacts** - 重命名构建产物
9. **Upload artifacts** - 上传到 GitHub Actions Artifacts
10. **Create Release** - 创建 GitHub Release（仅在 tag 触发时）

### 环境变量

- `GITHUB_TOKEN` - 由 GitHub 自动提供，用于创建 Release

## 自定义构建

如果需要修改构建配置，编辑以下文件：

- `.github/workflows/build.yml` - 工作流配置
- `src-tauri/tauri.conf.json` - Tauri 应用配置
- `package.json` - 项目版本号

## 注意事项

1. **版本号一致性**：确保 `package.json` 和 `src-tauri/tauri.conf.json` 中的版本号与 tag 版本一致

2. **缓存清理**：如果遇到依赖问题，可以在 Actions 设置中清除缓存

3. **构建时间**：首次构建约需 10-15 分钟，后续构建通过缓存可缩短至 5-8 分钟

4. **产物有效期**：Actions Artifacts 保留 30 天，Release 文件永久保留

## 本地构建

如果需要在本地构建：

```bash
# 安装依赖
npm install

# 构建
npm run build

# 打包为 Windows 安装包
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。
