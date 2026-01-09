# Teapot - API Debugger

Avalonia + MVVM + IoC + FluentAvalonia 模式实现的 Postman 克隆工具。

## 技术栈

- **.NET**: .NET 10.0
- **UI 框架**: Avalonia 11.3.10
- **设计系统**: FluentAvaloniaUI 2.4.1
- **MVVM 框架**: CommunityToolkit.Mvvm 8.2.1
- **依赖注入**: Microsoft.Extensions.DependencyInjection 8.0.0
- **图标库**: Projektanker.Icons.Avalonia.FontAwesome 9.6.2
- **JSON 处理**: System.Text.Json
- **HTTP 客户端**: System.Net.Http

## 项目特性

- ✅ **标签页管理**：多标签页同时编辑不同请求
- ✅ **请求历史**：自动记录每次发送的请求和响应
- ✅ **收藏夹**：手动保存常用请求
- ✅ **环境管理**：支持多环境切换（开发、测试、生产）
- ✅ **完整的请求构建**：支持 Params、Headers、Body、Authentication
- ✅ **脚本支持**：Pre-request Script 和 Test Script
- ✅ **响应查看**：状态、Headers、Cookies、Body、Test Results
- ✅ **数据持久化**：所有数据自动保存到本地 JSON 文件

## 快速开始

### 构建项目

```bash
dotnet build
```

### 运行项目

```bash
dotnet run
```

## 项目结构

详见 [ARCHITECTURE.md](./ARCHITECTURE.md) 文件了解详细的架构设计。

## 核心功能

### 1. 工作区

当前正在编辑和测试的 API 请求，支持：
- HTTP 方法选择（GET、POST、PUT、DELETE 等）
- URL 输入
- Query Parameters 编辑
- Headers 管理
- Body 编辑（支持多种格式）
- Authentication 配置（Basic、Bearer Token）
- Pre-request Script
- Test Script

**快捷键**：
- `Send` 按钮：发送请求
- `Save` 按钮：保存到收藏夹

### 2. 历史记录

自动记录每次发送的请求：
- 完整的请求信息
- 完整的响应信息
- 时间戳
- 成功/失败状态
- 错误消息（如果失败）

**历史操作**：
- 查看历史列表
- 搜索历史（待实现）
- 清空历史（待实现）

### 3. 收藏夹

手动保存常用请求以便快速访问：
- 添加到收藏夹
- 从收藏夹加载请求
- 支持文件夹组织（待实现）

### 4. 环境

管理不同环境的配置：
- 环境变量（baseUrl、tokens 等）
- 快速切换环境
- 默认环境：Default Environment

## 数据存储

所有数据存储在用户的应用数据目录：

| 文件 | 内容 |
|------|------|
| `teapot_working.json` | 当前工作区请求 |
| `teapot_history.json` | 请求历史记录 |
| `teapot_collections.json` | 收藏夹数据 |
| `teapot_environments.json` | 环境配置 |

**存储位置**：
```
Windows: C:\Users\<Username>\AppData\Roaming\Teapot\
macOS: ~/Library/Application Support/Teapot/
Linux: ~/.local/share/Teapot/
```

## 开发指南

### 添加新功能

1. 在 `Services/` 创建服务接口和实现
2. 在 `App.axaml.cs` 注册服务
3. 在 ViewModel 中注入并使用服务
4. 更新 View 以显示新功能

### 添加新数据模型

1. 在 `Models/` 创建模型类
2. 确保模型支持 `ObservableObject`（如需绑定）
3. 在服务中使用模型

### 添加新视图

1. 在 `Views/` 创建 XAML 文件
2. 在 `ViewModels/` 创建对应的 ViewModel
3. 在 `ViewLocator.cs` 注册（如使用自动定位）

## 架构优势

### MVVM 模式

- ✅ **职责分离**：Model、View、ViewModel 各司其职
- ✅ **可测试**：ViewModel 可独立单元测试
- ✅ **可维护**：逻辑集中在 ViewModel，View 只负责显示
- ✅ **可复用**：ViewModel 和 View 可在不同场景复用

### IoC 容器

- ✅ **依赖解耦**：通过接口依赖，而非具体实现
- ✅ **易于扩展**：添加新服务只需注册，无需修改现有代码
- ✅ **便于测试**：可以轻松 mock 依赖进行单元测试
- ✅ **生命周期管理**：Singleton 保证全局唯一实例

### 服务层模式

- ✅ **数据访问抽象**：通过服务接口统一数据访问
- ✅ **自动持久化**：数据变更时自动保存到文件
- ✅ **业务逻辑封装**：复杂逻辑封装在服务中
- ✅ **易于替换存储**：未来可轻松替换 JSON 为数据库

## 未来计划

- [ ] 添加导入/导出功能（Postman 格式）
- [ ] 实现历史记录搜索
- [ ] 支持收藏夹文件夹
- [ ] 添加请求模板
- [ ] 支持 WebSocket 测试
- [ ] 添加 GraphQL 支持
- [ ] 实现请求链（一个请求的输出作为下一个请求的输入）
- [ ] 添加代码片段管理
- [ ] 实现团队协作功能
- [ ] 支持云同步

## 许可证

待添加

## 贡献

欢迎提交 Issue 和 Pull Request！

## 致谢

- Avalonia UI 框架
- FluentAvaloniaUI 设计系统
- CommunityToolkit.Mvvm MVVM 框架
- Postman（灵感来源）
