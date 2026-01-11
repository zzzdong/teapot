using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Input;
using Avalonia.Controls;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using FluentAvalonia.UI.Controls;
using Teapot.Models;
using Teapot.Services;
using Teapot.Views;

namespace Teapot.ViewModels;

public partial class MainWindowViewModel : ObservableObject
{
    // 服务依赖
    private readonly IWorkingRequestsService _workingRequestsService;
    private readonly IHistoryService _historyService;
    private readonly ICollectionService _collectionService;
    private readonly IEnvironmentService _environmentService;
    private readonly IRequestPanelViewModelFactory _factory;

    // Properties
    [ObservableProperty]
    private int _selectedTabIndex;

    // 工作区 - 当前正在编辑的请求
    public ObservableCollection<RequestPanelViewModel> WorkingRequests => _workingRequestsService.GetWorkingRequests();

    // 历史记录 - 已发送的请求（包含响应）
    public ObservableCollection<HistoryItemModel> History => _historyService.GetHistory();

    // 收藏夹 - 用户保存的请求集合
    public ObservableCollection<CollectionItemViewModel> Collections => _collectionService.GetCollections();

    // 环境
    public ObservableCollection<EnvironmentModel> Environments => _environmentService.GetEnvironments();

    [ObservableProperty]
    private CollectionItemViewModel? _selectedCollection;

    [ObservableProperty]
    private EnvironmentModel? _selectedEnvironment;

    partial void OnSelectedEnvironmentChanged(EnvironmentModel? oldValue, EnvironmentModel? newValue)
    {
        if (newValue != null && newValue != oldValue)
        {
            _environmentService.SetSelectedEnvironment(newValue);
        }
    }

    public MainWindowViewModel(
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

    // Commands
    public ICommand AddNewTabCommand => new RelayCommand(AddNewTab);
    public ICommand CloseTabCommand => new AsyncRelayCommand<TabViewTabCloseRequestedEventArgs>(CloseTab);
    public ICommand SaveToCollectionCommand => new RelayCommand<RequestPanelViewModel>(SaveToCollection);

    private void AddNewTab()
        {
            var newRequest = new HttpRequestModel
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

            var viewModel = _factory.Create(newRequest);
            _workingRequestsService.AddRequest(viewModel);
        }

    /// <summary>
    /// 添加到历史记录（在发送请求后调用）
    /// </summary>
    public void AddToHistory(HttpRequestModel request, HttpResponseModel response, bool isSuccessful, string errorMessage = "")
    {
        var historyItem = new HistoryItemModel
        {
            Request = request,
            Response = response,
            Timestamp = DateTime.Now,
            IsSuccessful = isSuccessful,
            ErrorMessage = errorMessage
        };
        _historyService.AddToHistory(historyItem);
    }

    /// <summary>
    /// 保存请求到收藏夹
    /// </summary>
    private void SaveToCollection(RequestPanelViewModel? viewModel)
    {
        if (viewModel == null) return;

        _collectionService.AddToCollection(viewModel.Request);
    }

    public async Task CloseTab(TabViewTabCloseRequestedEventArgs? e)
    {
        if (e == null || WorkingRequests.Count <= 1)
        {
            // 如果只有一个标签页或事件参数为空，不关闭它
            return;
        }

        // 通过 Tab 属性获取要删除的项
        var tabItem = e.Tab;
        if (tabItem?.DataContext is RequestPanelViewModel viewModel)
        {
            // 显示确认对话框
            var dialog = new ContentDialog
            {
                Title = "确认关闭",
                Content = $"确定要关闭请求 \"{viewModel.Request.Name}\" 吗？",
                PrimaryButtonText = "关闭",
                CloseButtonText = "取消",
                DefaultButton = ContentDialogButton.Primary
            };

            var result = await dialog.ShowAsync();

            // 用户确认后才删除
            if (result == ContentDialogResult.Primary)
            {
                _workingRequestsService.RemoveRequest(viewModel);
            }
            // 注意：FluentAvalonia的TabViewTabCloseRequestedEventArgs没有Cancel属性
            // 如果用户取消，不执行任何操作即可保持标签页打开
        }
    }
    
    public void SaveWorkingRequests()
    {
        // 调用服务的保存方法，确保当前工作区请求被保存到文件
        _workingRequestsService.SaveRequests();
    }
}