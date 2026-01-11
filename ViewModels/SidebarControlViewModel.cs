using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Input;
using Avalonia.Controls;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using FluentAvalonia.UI.Controls;
using Teapot.Models;
using Teapot.Services;

namespace Teapot.ViewModels;

public partial class SidebarControlViewModel : ObservableObject
{
    // 服务依赖
    private readonly IWorkingRequestsService _workingRequestsService;
    private readonly IHistoryService _historyService;
    private readonly ICollectionService _collectionService;
    private readonly IEnvironmentService _environmentService;
    private readonly IRequestPanelViewModelFactory _factory;

    // Properties
    [ObservableProperty]
    private CollectionItemViewModel? _selectedCollection;

    // 工作区 - 当前正在编辑的请求
    public ObservableCollection<RequestPanelViewModel> WorkingRequests => _workingRequestsService.GetWorkingRequests();

    // 历史记录 - 已发送的请求（包含响应）
    public ObservableCollection<HistoryItemModel> History => _historyService.GetHistory();

    // 收藏夹 - 用户保存的请求集合
    public ObservableCollection<CollectionItemViewModel> Collections => _collectionService.GetCollections();

    // 环境
    public ObservableCollection<EnvironmentModel> Environments => _environmentService.GetEnvironments();

    [ObservableProperty]
    private EnvironmentModel? _selectedEnvironment;

    partial void OnSelectedEnvironmentChanged(EnvironmentModel? oldValue, EnvironmentModel? newValue)
    {
        if (newValue != null && newValue != oldValue)
        {
            _environmentService.SetSelectedEnvironment(newValue);
        }
    }

    // Commands
    public ICommand AddNewTabCommand => new RelayCommand<HttpRequestModel>(AddNewTab);
    public ICommand RemoveFromCollectionCommand => new AsyncRelayCommand<CollectionItemViewModel>(RemoveFromCollection);
    public ICommand RenameCollectionItemCommand => new RelayCommand<CollectionItemViewModel>(RenameCollectionItem);
    public ICommand ConfirmRenameCommand => new RelayCommand<CollectionItemViewModel>(ConfirmRename);
    public ICommand CancelRenameCommand => new RelayCommand<CollectionItemViewModel>(CancelRename);
    public ICommand AddDirectoryCommand => new RelayCommand(AddDirectory);
    public ICommand AddRequestCommand => new RelayCommand(AddRequest);

    public SidebarControlViewModel(
        IWorkingRequestsService workingRequestsService,
        IHistoryService historyService,
        ICollectionService collectionService,
        IEnvironmentService environmentService,
        IRequestPanelViewModelFactory factory)
    {
        _workingRequestsService = workingRequestsService;
        _historyService = historyService;
        _collectionService = collectionService;
        _environmentService = environmentService;
        _factory = factory;

        SelectedEnvironment = _environmentService.GetSelectedEnvironment();
    }

    private void AddNewTab(HttpRequestModel? request = null)
    {
        HttpRequestModel newRequest;
        
        if (request != null)
        {
            // 如果传入了请求，则使用该请求
            newRequest = request;
        }
        else
        {
            // 否则创建一个新的示例请求
            newRequest = new HttpRequestModel
            {
                Name = $"Request {WorkingRequests.Count + 1}",
                Method = "GET",
                Url = "https://httpbin.org/get",
                QueryParameters = new List<Parameter>
                {
                    new Parameter { Key = "param1", Value = "value1", IsActive = true }
                },
                Headers = new List<Header>
                {
                    new Header { Key = "Content-Type", Value = "application/json", IsActive = true }
                },
                Body = "{\n  \"key\": \"value\"\n}",
                BodyType = "raw"
            };
        }

        var viewModel = _factory.Create(newRequest);
        _workingRequestsService.AddRequest(viewModel);
    }

    private async Task RemoveFromCollection(CollectionItemViewModel? item)
    {
        if (item != null)
        {
            // 显示确认对话框
            var dialog = new ContentDialog
            {
                Title = "确认删除",
                Content = $"确定要删除\"{item.Name}\"吗？",
                PrimaryButtonText = "删除",
                CloseButtonText = "取消",
                DefaultButton = ContentDialogButton.Close
            };

            var result = await dialog.ShowAsync();

            if (result == ContentDialogResult.Primary)
            {
                _collectionService.RemoveFromCollection(item);
            }
        }
    }

    private void RenameCollectionItem(CollectionItemViewModel? item)
    {
        if (item != null)
        {
            // 进入编辑模式
            item.IsEditing = true;
            item.EditName = item.Name;
        }
    }

    private void ConfirmRename(CollectionItemViewModel? item)
    {
        if (item != null)
        {
            var newName = item.EditName?.Trim();
            if (!string.IsNullOrEmpty(newName) && newName != item.Name)
            {
                item.Name = newName;
                _collectionService.SaveCollections();
            }
            item.IsEditing = false;
        }
    }

    private void CancelRename(CollectionItemViewModel? item)
    {
        if (item != null)
        {
            // 取消编辑，恢复原始名称
            item.EditName = item.Name;
            item.IsEditing = false;
        }
    }

    private async void AddDirectory()
    {
        // 显示对话框让用户输入文件夹名称
        var dialog = new ContentDialog
        {
            Title = "新增文件夹",
            Content = new TextBox { Watermark = "输入文件夹名称" },
            PrimaryButtonText = "确认",
            CloseButtonText = "取消",
            DefaultButton = ContentDialogButton.Primary
        };

        var result = await dialog.ShowAsync();

        if (result == ContentDialogResult.Primary && dialog.Content is TextBox textBox)
        {
            var name = textBox.Text?.Trim();
            if (!string.IsNullOrEmpty(name))
            {
                // 创建新文件夹
                var collectionItem = new CollectionItemViewModel(name, CollectionItemType.Folder);
                _collectionService.AddToCollection(collectionItem);
            }
        }
    }

    private async void AddRequest()
    {
        // 显示对话框让用户输入请求名称
        var dialog = new ContentDialog
        {
            Title = "新增请求",
            Content = new TextBox { Watermark = "输入请求名称" },
            PrimaryButtonText = "确认",
            CloseButtonText = "取消",
            DefaultButton = ContentDialogButton.Primary
        };

        var result = await dialog.ShowAsync();

        if (result == ContentDialogResult.Primary && dialog.Content is TextBox textBox)
        {
            var name = textBox.Text?.Trim();
            if (!string.IsNullOrEmpty(name))
            {
                // 创建新请求
                var request = new HttpRequestModel
                {
                    Name = name,
                    Method = "GET",
                    Url = "https://httpbin.org/get",
                    QueryParameters = new List<Parameter>(),
                    Headers = new List<Header>(),
                    Body = "{\n  \"key\": \"value\"\n}",
                    BodyType = "raw"
                };
                _collectionService.AddToCollection(request);
            }
        }
    }
}