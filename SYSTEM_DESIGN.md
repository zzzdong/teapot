# Teapot - System Design Document

## Overview

Teapot is a Postman clone built with Tauri 2.x and Vue 3, designed for API testing and debugging. This document provides a comprehensive system design and implementation status.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Tauri Desktop App                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Vue 3)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  UI Layer (Naive UI Components)                     │   │
│  │  ├─ Request Builder                                 │   │
│  │  ├─ Response Viewer                                │   │
│  │  ├─ Workspace & Layout                             │   │
│  │  └─ Sidebar Panels                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Business Logic (Composables & Stores)              │   │
│  │  ├─ useHttpClient (Request Execution)                │   │
│  │  ├─ scriptExecutor (Script Engine)                   │   │
│  │  ├─ Pinia Stores (State Management)                 │   │
│  │  └─ Tauri API (Native Integration)                  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Backend (Tauri/Rust)                                       │
│  ├─ HTTP Plugin (@tauri-apps/plugin-http)                 │
│  ├─ Store Plugin (@tauri-apps/plugin-store)               │
│  └─ System APIs (File system, OS integration)             │
└─────────────────────────────────────────────────────────────┘
```

## 模块设计

### 1. 请求构建模块 ✅

**核心功能**: 配置和发送 HTTP 请求。

**组件**:
- `RequestBuilder.vue` - 主请求配置界面
- `ParamsTab.vue` - URL 查询参数编辑器
- `HeadersTab.vue` - HTTP 头部编辑器
- `BodyTab.vue` - 请求体类型选择器
- `FormDataEditor.vue` - Multipart 表单数据编辑器
- `UrlEncodedEditor.vue` - URL 编码表单编辑器
- `RawEditor.vue` - 原始请求体编辑器(JSON/XML等)
- `BinaryEditor.vue` - 二进制文件上传
- `GraphQLEditor.vue` - GraphQL 查询/变更编辑器
- `AuthTab.vue` - 认证配置
- `PreRequestScriptTab.vue` - 前置请求脚本编辑器
- `TestsTab.vue` - 测试脚本编辑器
- `SaveRequestDialog.vue` - 保存请求对话框

**功能**:
- 支持 HTTP 方法: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- 动态请求体类型切换
- Monaco Editor 代码编辑
- 参数/头部启用/禁用管理
- 文件上传(form-data, binary)
- GraphQL 查询 + 变量

### 2. 响应查看模块 ✅

**核心功能**: 显示和分析 HTTP 响应。

**组件**:
- `ResponseViewer.vue` - 主响应容器
- `ResponseBody.vue` - 响应体查看器
- `ResponseHeaders.vue` - 响应头部显示
- `ResponseCookies.vue` - Cookie 显示
- `ResponseTests.vue` - 测试结果显示

**功能**:
- JSON/XML 美化显示
- 原始文本视图
- 预览模式(HTML 渲染)
- 语法高亮(JavaScript, TypeScript, JSON, XML, CSS, Bash, Python)
- 状态码颜色标识
- 响应时间和大小显示
- 下载/复制响应

### 3. 工作空间管理模块 ✅

**核心功能**: 管理标签页和应用布局。

**组件**:
- `MainWorkspace.vue` - 主工作空间(带标签页)
- `LeftSidebar.vue` - 左侧边栏(收藏夹,历史记录)
- `RightSidebar.vue` - 右侧边栏(环境变量,控制台)
- `AppHeader.vue` - 应用头部
- `StatusBar.vue` - 状态栏

**Store**:
- `workspace.ts` - 工作空间标签页和激活状态

**功能**:
- 多标签页支持
- 标签页激活/关闭(单个/全部/其他)
- 修改状态追踪
- 可调整侧边栏宽度(200px-500px)
- 工作空间持久化

### 4. 收藏夹管理模块 ✅

**核心功能**: 组织和保存请求。

**组件**:
- `CollectionsPanel.vue` - 收藏夹树视图
- `CollectionTreeItem.vue` - 递归树项
- `SaveRequestDialog.vue` - 保存对话框

**Store**:
- `collections.ts` - 收藏夹和请求状态

**功能**:
- 创建/编辑/删除收藏夹
- 嵌套文件夹结构
- 保存请求到收藏夹/文件夹
- 导入/导出(Teapot 格式, Postman Collection v2.1)

### 5. 历史记录模块 ✅

**核心功能**: 追踪和管理请求历史。

**组件**:
- `HistoryPanel.vue` - 历史记录列表

**Store**:
- `history.ts` - 请求历史状态

**功能**:
- 自动记录请求
- 按 URL,方法,名称搜索
- 收藏请求(星标)
- 加载历史请求
- 最多 100 条(非收藏)
- 收藏项保留
- 相对时间显示
- 执行次数追踪

### 6. 环境变量模块 ✅

**核心功能**: 管理不同作用域的变量。

**组件**:
- `EnvironmentPanel.vue` - 变量编辑器

**Store**:
- `environment.ts` - 变量状态

**功能**:
- 三种作用域: 全局,环境,本地
- 变量启用/禁用
- 请求中变量解析({{variableName}})
- 动态变量(timestamp, randomInt, guid 等)
- 导入/导出变量

**动态变量**:
- `{{$timestamp}}` - 当前时间戳
- `{{$randomInt}}` - 随机整数
- `{{$guid}}` - 随机 GUID
- `{{$randomString}}` - 随机字符串

### 7. 控制台模块 ✅

**核心功能**: 显示请求执行时的实时日志。

**组件**:
- `ConsolePanel.vue` - 控制台日志
- `ScriptLogPanel.vue` - 脚本执行日志面板

**Store**:
- `console.ts` - 控制台日志状态

**功能**:
- 实时日志显示
- 多日志级别: log, info, warn, error
- 自动滚动到最新
- 最多 100 条日志
- 清空控制台
- 日志级别颜色编码

### 8. HTTP 客户端模块 ✅

**核心功能**: 执行功能完整的 HTTP 请求。

**Composable**:
- `useHttpClient.ts` - HTTP 请求执行

**功能**:
- Tauri HTTP 插件集成
- URL,头部,请求体,认证中的变量解析
- 前置请求脚本执行
- 测试脚本执行
- 多种认证类型
- 错误处理
- 请求超时

**认证类型**:
- No Auth
- Bearer Token
- Basic Auth
- API Key

**执行流程**:
```
sendRequest() → 验证输入 → 执行前置请求脚本 → 解析变量(全局→环境→本地) → 构建请求 → 发送请求 → 执行测试脚本 → 返回响应+测试结果
```

### 9. 脚本执行模块 ✅

**核心功能**: 使用 Postman 兼容 API 执行用户脚本。

**工具**:
- `scriptExecutor.ts` - 脚本执行引擎

**功能**:
- Postman 兼容 API
- 前置请求脚本
- 测试脚本
- 变量修改
- 请求修改
- 语法验证
- 错误处理

**Postman API**:
```javascript
// 测试断言
pm.test("Status code is 200", function() {
  pm.response.to.have.status(200);
});

// expect 断言
pm.expect(pm.response.json().name).to.eql("John");

// 变量设置
pm.environment.set("token", "abc123");
pm.globals.set("apiKey", "xyz789");

// 请求修改
pm.request.url = "https://api.example.com/v2";
```

### 10. 持久化模块 ✅

**核心功能**: 持久化应用数据。

**API**:
- `api/tauri-api.ts` - Tauri API 封装

**功能**:
- Tauri Store v2 集成
- Web 端 localStorage 降级
- 自动持久化
- 存储操作: get, set, delete

**存储数据**:
- 工作空间标签页
- 激活标签 ID
- 收藏夹
- 请求
- 环境
- 变量
- 历史记录
- 设置

### 11. 上下文存储模块 ✅

**核心功能**: 使用 RequestContext 架构统一数据管理。

**Store**:
- `context.ts` - RequestContext 管理存储

**功能**:
- 合并 RequestStore 和 ResponseStore 功能
- 管理多个 RequestContext 实例
- 提供请求/响应管理的综合操作
- 包含响应处理工具(Cookie 提取,Body 格式化)
- 支持 Context 持久化
- 多 Context 状态管理

### 12. 导入/导出模块 ✅

**核心功能**: 从外部格式导入和导出 API 集合。

**组件**:
- `ImportModal.vue` - 分步导入界面

**工具**:
- `postmanParser.ts` - Postman Collection v2.1 解析器和转换器

**功能**:
- 分步导入向导(2 步: 选择/预览)
- 标签页界面(文件上传 / 文本输入)
- 拖放文件上传
- Monaco Editor 文本输入(cURL, JSON)
- 格式检测(Teapot vs Postman)
- Postman Collection v2.1 解析和转换
- 导入预览和统计
- 支持收藏夹,文件夹,请求和环境
- 错误处理和验证

**支持格式**:
- Teapot 原生格式(.json)
- Postman Collection v2.1(.json)
- cURL 命令

### 13. 代码生成模块 ✅

**核心功能**: 为 HTTP 请求生成多语言代码片段。

**组件**:
- `CodeGeneratorDrawer.vue` - 代码生成器抽屉

**功能**:
- 多语言支持(JavaScript, Python, cURL 等)
- 复制到剪贴板功能
- 生成代码语法高亮
- 语言选择器
- 实时代码生成

**支持语言**:
- cURL
- JavaScript (Fetch)
- TypeScript (Fetch)
- Python (Requests)
- Go (net/http)
- Java (HttpClient)
- C# (HttpClient)

### 14. cURL 解析模块 ✅

**核心功能**: 解析 cURL 命令并转换为 Teapot 请求格式。

**工具**:
- `curlParser.ts` - cURL 命令解析器

**功能**:
- 解析标准 cURL 命令
- 提取 HTTP 方法,URL,头部,请求体
- 支持各种 cURL 选项
- 转换为 Teapot 内部格式
- 与 ImportModal 文本输入集成

**支持的 cURL 功能**:
- HTTP 方法(GET, POST, PUT, DELETE 等)
- 头部(-H, --header)
- 请求体(-d, --data, --data-binary)
- URL 编码数据
- JSON 数据

### 15. 设置管理模块 ✅

**核心功能**: 管理应用设置和配置。

**组件**:
- `SettingsDialog.vue` - 设置对话框
- `HttpClientSettingsTab.vue` - HTTP 客户端设置标签页

**Store**:
- `settings.ts` - 设置状态

**功能**:
- HTTP 客户端配置(超时,代理,SSL 验证等)
- 通用设置(待实现)
- 网络设置(待实现)
- 编辑器设置(待实现)
- 设置持久化

**HTTP 客户端设置**:
- SSL 证书验证
- 默认超时时间
- 默认 User-Agent
- 自动跟随重定向
- CA 证书路径(支持多个)
- 代理设置(主机,端口,协议,用户名,密码)
- Native system integration
- File system access
- Cross-platform (Windows, macOS, Linux)
- Minimal Rust backend (no business logic)

## Data Flow Diagrams

### Request Flow (RequestContext Architecture)

```
┌──────────────┐
│   User       │
│   Input      │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│ RequestBuilder   │
│ (Config)         │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ Context Store    │
│ (RequestContext) │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ useHttpClient   │
│ (Resolve Vars)   │
└──────┬───────────┘
       │
       ├─→ ┌─────────────────┐
       │   │ Pre-request     │
       │   │ Script          │
       │   └────────┬────────┘
       │            │
       └────────────┘
                    │
                    ↓
         ┌──────────────────┐
         │ Build Request    │
         │ (Headers, Body)  │
         └──────┬───────────┘
                │
                ↓
      ┌──────────────────┐
      │ tauri-api       │
      │ (HTTP Plugin)   │
      └──────┬───────────┘
             │
             ↓
      ┌──────────────────┐
      │ Tauri HTTP       │
      │ (Native)         │
      └──────┬───────────┘
             │
             ↓
      ┌──────────────────┐
      │ Response         │
      └──────┬───────────┘
             │
             ├─→ ┌─────────────────┐
             │   │ Test Script     │
             │   └────────┬────────┘
             │            │
             └────────────┘
                          │
                          ↓
                   ┌─────────────────┐
                   │ Update Context  │
                   │ (Context Store) │
                   └──────────┬──────┘
                              │
                              ↓
                   ┌──────────────┐
                   │ ResponseViewer│
                   │ (Context Data)│
                   └──────┬───────┘
                          │
                          ├─→ History Store
                          └─→ Test Results
```

### Variable Resolution Flow

```
Request Reference ({{variable}})
       │
       ↓
┌──────────────────┐
│ Local Scope      │ (highest priority)
│ (Modified by     │
│  pre-request)    │
└──────┬───────────┘
       │ Not Found?
       ↓
┌──────────────────┐
│ Environment      │
│ Scope            │
└──────┬───────────┘
       │ Not Found?
       ↓
┌──────────────────┐
│ Global Scope     │ (lowest priority)
└──────┬───────────┘
       │ Not Found?
       ↓
┌──────────────────┐
│ Dynamic Variable │
│ (timestamp, etc) │
└──────────────────┘
```

### State Management Flow (RequestContext Architecture)

```
User Action
    │
    ↓
Component Event
    │
    ↓
Context Store Action
    │
    ├─→ Update RequestContext (reactive)
    │
    ├─→ Persist Context (tauri-api.store.set)
    │
    └─→ Component Re-render
         │
         ├─→ RequestBuilder (Request Data)
         └─→ ResponseViewer (Response Data)
```

## Technology Stack

### Frontend
- **Framework:** Vue 3.3+ with Composition API
- **Language:** TypeScript 5.1+
- **State Management:** Pinia 2.1+
- **Core Architecture:** RequestContext (unified data management)
- **UI Library:** Naive UI 2.34+
- **Code Editor:** Monaco Editor 0.55+
- **Syntax Highlighting:** highlight.js 11.11+
- **Date/Time:** dayjs 1.11+
- **Cryptography:** crypto-js 4.1+
- **UUID:** uuid 9.0+
- **HTTP:** @tauri-apps/plugin-http 2.5+
- **Storage:** @tauri-apps/plugin-store 2.4+
- **Icons:** @vicons/ionicons5 0.13+
- **Utils:** @vueuse/core 10.0+

### Backend
- **Runtime:** Tauri 2.9+
- **Language:** Rust (minimal)
- **HTTP Plugin:** @tauri-apps/plugin-http
- **Store Plugin:** @tauri-apps/plugin-store

### Build Tools
- **Bundler:** Vite with rolldown-vite 7.0+
- **Type Checking:** vue-tsc 3.2+
- **Tauri CLI:** @tauri-apps/cli 2.9+

## Project Structure

```
teapot/
├── src/
│   ├── api/
│   │   └── tauri-api.ts          # Tauri API wrapper
│   ├── assets/                   # Static assets
│   ├── components/
│   │   ├── common/               # Common components
│   │   │   ├── MonacoEditor.vue
│   │   │   ├── SimpleTable.vue
│   │   │   └── ImportModal.vue   # Step-by-step import interface
│   │   ├── request/              # Request builder components
│   │   │   ├── AuthTab.vue
│   │   │   ├── BinaryEditor.vue
│   │   │   ├── BodyTab.vue
│   │   │   ├── CodeGeneratorDrawer.vue   # Code generator drawer
│   │   │   ├── FormDataEditor.vue
│   │   │   ├── GraphQLEditor.vue
│   │   │   ├── HeadersTab.vue
│   │   │   ├── ParamsTab.vue
│   │   │   ├── PreRequestScriptTab.vue
│   │   │   ├── RawEditor.vue
│   │   │   ├── RequestBuilder.vue
│   │   │   ├── SaveRequestDialog.vue
│   │   │   ├── ScriptLogPanel.vue
│   │   │   ├── TestsTab.vue
│   │   │   └── UrlEncodedEditor.vue
│   │   ├── settings/              # Settings components
│   │   │   ├── HttpClientSettingsTab.vue
│   │   │   └── SettingsDialog.vue
│   │   └── layout/                # Layout components
│   │       ├── AppHeader.vue
│   │       ├── CollectionTreeItem.vue
│   │       ├── CollectionsPanel.vue
│   │       ├── ConsolePanel.vue
│   │       ├── DocumentationPanel.vue
│   │       ├── EnvironmentPanel.vue
│   │       ├── HistoryPanel.vue
│   │       ├── LeftSidebar.vue
│   │       ├── MainWorkspace.vue
│   │       ├── RightSidebar.vue
│   │       ├── StatusBar.vue
│   │       └── TestsPanel.vue
│   ├── composables/              # Composable functions
│   │   ├── index.ts
│   │   ├── useHttpClient.ts
│   │   └── useWorkspace.ts
│   ├── stores/                   # Pinia stores
│   │   ├── collections.ts
│   │   ├── console.ts
│   │   ├── context.ts
│   │   ├── environment.ts
│   │   ├── history.ts
│   │   ├── settings.ts
│   │   └── workspace.ts
│   ├── styles/                   # Global styles
│   │   └── main.css
│   ├── types/                    # TypeScript types
│   │   ├── auth.ts
│   │   ├── collection.ts
│   │   ├── context.ts
│   │   ├── environment.ts
│   │   ├── history.ts
│   │   ├── index.ts
│   │   ├── request.ts
│   │   ├── response.ts
│   │   ├── script.ts
│   │   ├── settings.ts
│   │   ├── tauri.ts
│   │   ├── test.ts
│   │   ├── websocket.ts
│   │   └── workspace.ts
│   ├── utils/                    # Utilities
│   │   ├── curlParser.ts         # cURL command parser
│   │   ├── postmanParser.ts      # Postman Collection v2.1 parser
│   │   ├── responseUtils.ts      # Response processing utilities
│   │   └── scriptExecutor.ts     # Script execution engine
│   ├── App.vue                   # Root component
│   └── main.ts                   # Application entry
├── src-tauri/                    # Tauri backend
│   ├── capabilities/              # Tauri permissions
│   ├── icons/                    # Application icons
│   ├── src/
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── dist/                         # Build output
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Implementation Status

### Completed Features ✅

| Module | Status | Notes |
|--------|--------|-------|
| Request Builder | ✅ Complete | All HTTP methods, body types, auth |
| Response Viewer | ✅ Complete | All view modes, syntax highlighting |
| Workspace | ✅ Complete | Multi-tab, resizable sidebars |
| Collections | ✅ Complete | CRUD operations, folders |
| History | ✅ Complete | Auto-logging, search, favorites |
| Environment | ✅ Complete | Global/Environment/Local scopes |
| Console | ✅ Complete | Real-time logs, auto-scroll |
| HTTP Client | ✅ Complete | Full auth support, scripts |
| Script Engine | ✅ Complete | Postman-compatible API |
| Persistence | ✅ Complete | Tauri Store, fallback |
| Monaco Editor | ✅ Complete | Integrated for scripts |
| Syntax Highlighting | ✅ Complete | Multiple languages |
| Context Store | ✅ Complete | RequestContext architecture, merged Request/Response Store |
| RequestContext Integration | ✅ Complete | Components updated to use RequestContext |
| Code Generator | ✅ Complete | Multi-language code snippets (JavaScript, Python, cURL) |
| cURL Parser | ✅ Complete | Parse and import cURL commands |
| Import/Export | ✅ Complete | Step-by-step modal, Teapot, Postman & cURL support |

### Planned Features 🚧

- WebSocket support
- GraphQL schema introspection
- OpenAPI import/export
- Batch request execution
- Test reports
- Multiple workspaces
- Dark mode
- Keyboard shortcuts
- Request/response diffing
- Proxy configuration
- Mock servers

## Performance & Security

**Performance:**
- Lazy loading of components
- Efficient reactivity with Pinia
- Minimized re-renders

**Security:**
- Sandboxed Tauri environment
- No code execution in backend
- HTTPS validation
- XSS protection (Vue)

## Testing

- Manual testing for critical flows
- Unit, integration, and E2E tests (planned)
- Performance benchmarks (planned)

## Deployment

**Build Targets:**
- Windows (MSI, NSIS)
- macOS (DMG, APP)
- Linux (DEB, AppImage)

**Build Commands:**
```bash
npm run vite:build          # Build frontend
npm run build    # Build desktop app
```