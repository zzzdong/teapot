# Teapot 项目架构文档

## 技术栈

- **UI 框架**: Avalonia 11.3.10
- **设计系统**: FluentAvaloniaUI 2.4.1
- **MVVM 框架**: CommunityToolkit.Mvvm 8.2.1
- **依赖注入**: Microsoft.Extensions.DependencyInjection 8.0.0
- **数据持久化**: System.Text.Json (JSON 文件存储)

## 项目结构

```
Teapot/
├── Models/                    # 数据模型
│   ├── HttpRequestModel.cs     # HTTP 请求模型
│   ├── HttpResponseModel.cs    # HTTP 响应模型
│   ├── HistoryItemModel.cs     # 历史记录项
│   ├── CollectionModel.cs      # 收藏夹模型
│   ├── EnvironmentModel.cs     # 环境配置模型
│   ├── Parameter.cs           # 参数模型
│   ├── Header.cs              # 头部模型
│   ├── Authentication.cs      # 认证模型
│   └── HttpConstants.cs       # HTTP 常量定义
├── Services/                  # 业务服务层
│   ├── IHttpService.cs        # HTTP 服务接口
│   ├── IHistoryService.cs     # 历史记录服务接口
│   ├── IWorkingRequestsService.cs # 工作区服务接口
│   ├── ICollectionService.cs  # 收藏夹服务接口
│   ├── IEnvironmentService.cs # 环境服务接口
│   ├── IRequestPanelViewModelFactory.cs # ViewModel 工厂接口
│   ├── IWorkingRequestsService.cs # 工作区服务接口
│   ├── HttpService.cs         # HTTP 服务实现
│   ├── HistoryService.cs      # 历史记录服务实现
│   ├── WorkingRequestsService.cs # 工作区服务实现
│   ├── CollectionService.cs   # 收藏夹服务实现
│   ├── EnvironmentService.cs  # 环境服务实现
│   └── RequestPanelViewModelFactory.cs # ViewModel 工厂实现
├── ViewModels/                # 视图模型
│   ├── MainWindowViewModel.cs # 主窗口 ViewModel
│   ├── RequestPanelViewModel.cs # 请求面板 ViewModel
│   └── CollectionItemViewModel.cs # 收藏项 ViewModel
├── Views/                     # 视图层
│   ├── MainWindow.axaml       # 主窗口
│   ├── MainWindow.axaml.cs    # 主窗口代码
│   ├── RequestPanel.axaml     # 请求面板
│   ├── RequestPanel.axaml.cs  # 请求面板代码
│   ├── SidebarControl.axaml   # 侧边栏
│   ├── SidebarControl.axaml.cs # 侧边栏代码
│   ├── AuxiliaryPanelControl.axaml # 辅助面板
│   └── AuxiliaryPanelControl.axaml.cs # 辅助面板代码
├── ARCHITECTURE.md            # 架构文档
├── App.axaml                  # 应用资源
├── App.axaml.cs               # 应用启动与 DI 配置
├── Program.cs                 # 程序入口
└── ViewLocator.cs             # 视图定位器
```

## 核心架构模式

### MVVM (Model-View-ViewModel)

**职责分离**：

1. **Model (模型层)**
   - 定义数据结构和业务实体
   - 不包含任何 UI 逻辑
   - 可被多个 ViewModel 共享

2. **View (视图层)**
   - XAML 文件，负责 UI 呈现
   - 通过绑定与 ViewModel 交互
   - 不包含业务逻辑

3. **ViewModel (视图模型层)**
   - 连接 Model 和 View 的桥梁
   - 处理 UI 状态和命令
   - 通过服务层访问数据

### IoC (Inversion of Control)

**依赖注入容器**：

```csharp
// App.axaml.cs
var serviceCollection = new ServiceCollection();

// 基础服务
serviceCollection.AddSingleton<IHttpService, HttpService>();

// 数据管理服务
serviceCollection.AddSingleton<IHistoryService, HistoryService>();
serviceCollection.AddSingleton<IWorkingRequestsService, WorkingRequestsService>();
serviceCollection.AddSingleton<ICollectionService, CollectionService>();
serviceCollection.AddSingleton<IEnvironmentService, EnvironmentService>();

// 工厂服务
serviceCollection.AddSingleton<IRequestPanelViewModelFactory, RequestPanelViewModelFactory>();

// ViewModel
serviceCollection.AddSingleton<MainWindowViewModel>();

Services = serviceCollection.BuildServiceProvider();
```

**服务生命周期**：
- **Singleton**: 整个应用生命周期内只创建一个实例
- **Transient**: 每次请求都创建新实例（当前未使用）

### FluentAvalonia UI 组件

- **TabView**: 主工作区的标签页容器
- **ContentDialog**: 确认对话框
- **Icons.Avalonia**: FontAwesome 图标支持

## 数据流架构

### 1. 工作区 (WorkingRequests)

```
用户操作 → MainWindowViewModel.AddNewTab()
           ↓
    WorkingRequestsService.AddRequest()
           ↓
    JSON 持久化 (teapot_working.json)
           ↓
    View 更新 (TabView 自动刷新)
```

**职责**：
- 存储当前正在编辑/测试的 API 请求
- 临时的，可以随时关闭
- 通过 `WorkingRequestsService` 管理
- 应用启动时自动加载上次保存的请求
- 应用关闭时自动保存当前请求

### 2. 历史记录 (History)

```
RequestPanel.SendRequestCommand
           ↓
    HttpService.SendRequestAsync()
           ↓
    MainWindowViewModel.AddToHistory()
           ↓
    HistoryService.AddToHistory()
           ↓
    JSON 持久化 (teapot_history.json)
           ↓
    View 更新 (Sidebar History 自动刷新)
```

**职责**：
- 记录每次发送的完整请求和响应
- 包含时间戳、成功状态、错误信息
- 通过 `HistoryService` 管理
- 按时间倒序显示（最新的在前）

### 3. 收藏夹 (Collections)

```
RequestPanel.SaveToCollectionCommand
           ↓
    MainWindowViewModel.SaveToCollection()
           ↓
    CollectionService.AddToCollection()
           ↓
    JSON 持久化 (teapot_collections.json)
           ↓
    View 更新 (Sidebar Collections 自动刷新)
```

**职责**：
- 用户手动保存常用请求
- 支持文件夹组织（未实现）
- 通过 `CollectionService` 管理

### 4. 环境 (Environments)

```
EnvironmentComboBox 选择
           ↓
    EnvironmentService.SetSelectedEnvironment()
           ↓
    JSON 持久化 (teapot_environments.json)
           ↓
    View 更新
```

**职责**：
- 存储环境变量（baseUrl、tokens 等）
- 支持多环境切换
- 通过 `EnvironmentService` 管理

## 数据持久化策略

### 文件存储位置

所有数据文件存储在用户的应用数据目录：

```csharp
Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)
```

### 文件列表

| 文件名 | 内容 | 服务 |
|---------|------|------|
| `teapot_working.json` | 当前工作区请求 | `WorkingRequestsService` |
| `teapot_history.json` | 请求历史记录 | `HistoryService` |
| `teapot_collections.json` | 收藏夹数据 | `CollectionService` |
| `teapot_environments.json` | 环境配置 | `EnvironmentService` |

### 序列化格式

```json
// teapot_history.json 示例
[
  {
    "Id": "guid",
    "Timestamp": "2024-01-09T10:30:00",
    "Request": { ... },
    "Response": { ... },
    "IsSuccessful": true,
    "ErrorMessage": ""
  }
]
```

## 服务接口设计

### IHttpService

```csharp
Task<HttpResponseModel> SendRequestAsync(HttpRequestModel request);
```

### IHistoryService

```csharp
ObservableCollection<HistoryItemModel> GetHistory();
void AddToHistory(HistoryItemModel item);
void ClearHistory();
void RemoveHistoryItem(HistoryItemModel item);
```

### IWorkingRequestsService

```csharp
ObservableCollection<HttpRequestModel> GetWorkingRequests();
void AddRequest(HttpRequestModel request);
void RemoveRequest(HttpRequestModel request);
void ClearRequests();
HttpRequestModel? GetRequestById(string id);
void SaveRequests();  // 新增：允许显式保存工作区请求
```

### ICollectionService

```csharp
ObservableCollection<CollectionItemViewModel> GetCollections();
void AddToCollection(HttpRequestModel request);
void AddCollection(CollectionModel collection);
void RemoveFromCollection(CollectionItemViewModel item);
void ClearCollections();
```

### IEnvironmentService

```csharp
ObservableCollection<EnvironmentModel> GetEnvironments();
void AddEnvironment(EnvironmentModel environment);
void RemoveEnvironment(EnvironmentModel environment);
void UpdateEnvironment(EnvironmentModel environment);
EnvironmentModel? GetSelectedEnvironment();
void SetSelectedEnvironment(EnvironmentModel environment);
```

## MVVM 绑定示例

### View → ViewModel

```xml
<!-- MainWindow.axaml -->
<TabView TabItems="{Binding WorkingRequests}"/>
```

### ViewModel → Service

```csharp
// MainWindowViewModel.cs
private readonly IWorkingRequestsService _workingRequestsService;

public ObservableCollection<HttpRequestModel> WorkingRequests 
    => _workingRequestsService.GetWorkingRequests();

private void AddNewTab()
{
    var newRequest = new HttpRequestModel { ... };
    _workingRequestsService.AddRequest(newRequest);
}

// 在应用关闭时显式保存工作区请求
public void SaveWorkingRequests()
{
    _workingRequestsService.SaveRequests();
}
```

### ViewModel → Model

```csharp
// RequestPanelViewModel.cs
public partial class RequestPanelViewModel : ObservableObject
{
    [ObservableProperty]
    private HttpRequestModel _request;
}
```

## 扩展性

### 添加新数据服务

1. 在 `Services/` 创建接口 `IXxxService`
2. 创建实现类 `XxxService : IXxxService`
3. 在 `App.axaml.cs` 注册：
   ```csharp
   serviceCollection.AddSingleton<IXxxService, XxxService>();
   ```
4. 在 ViewModel 中注入使用：
   ```csharp
   public XxxViewModel(IXxxService xxxService) { ... }
   ```

### 替换数据存储

只需修改具体服务实现：

```csharp
// 当前：JSON 文件存储
private void Save() => File.WriteAllText(_path, JsonSerializer.Serialize(data));

// 未来：数据库存储
private void Save() => _dbContext.SaveChangesAsync();
```

View 和 ViewModel 无需修改。

## 最佳实践

### 1. 服务单一职责

每个服务只负责一类数据的管理：
- ✅ `HistoryService` 只管理历史
- ✅ `WorkingRequestsService` 只管理工作区
- ❌ 避免一个服务管理多种数据

### 2. 依赖注入而非直接实例化

```csharp
// ❌ 不推荐
public class XxxViewModel
{
    private readonly IHistoryService _historyService = new HistoryService();
}

// ✅ 推荐
public class XxxViewModel(IXxxService xxxService) { ... }
```

### 3. 服务使用接口而非实现

```csharp
// ViewModel 中
private readonly IHistoryService _historyService; // 使用接口

// 注册时
serviceCollection.AddSingleton<IHistoryService, HistoryService>();
```

### 4. 数据持久化自动触发

服务在数据变更时自动保存：

```csharp
public void AddItem(Item item)
{
    _items.Add(item);
    Save(); // 自动持久化
}
```

同时，为保证应用关闭时数据不丢失，提供了显式的保存方法：
```csharp
public void SaveRequests()  // 可显式调用保存
{
    try
    {
        var json = JsonSerializer.Serialize(_requests.ToList());
        File.WriteAllText(_dataFilePath, json);
    }
    catch
    {
        // 保存失败时忽略
    }
}
```

### 5. Observable 自动通知更新

```csharp
// ViewModel 属性直接返回服务的集合
public ObservableCollection<HttpRequestModel> WorkingRequests 
    => _workingRequestsService.GetWorkingRequests();

// 当服务中集合变更时，View 自动刷新
```

## 设计模式总结

| 模式 | 实现 | 优势 |
|------|--------|------|
| **MVVM** | ViewModel + View | 职责分离，可测试，可维护 |
| **IoC** | DI 容器 | 解耦，易于扩展，便于单元测试 |
| **Repository Pattern** | Service 接口 + 实现 | 数据访问抽象，易于替换存储方式 |
| **Observable Pattern** | ObservableCollection | UI 自动响应数据变化 |
| **Command Pattern** | RelayCommand / AsyncRelayCommand | 绑定用户操作到方法 |
| **Factory Pattern** | IRequestPanelViewModelFactory | 解决 ViewModel 构造函数依赖注入问题 |
