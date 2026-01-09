using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Input;
using Avalonia.Controls;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Teapot.Models;
using Teapot.Services;
using FluentAvalonia.UI.Controls;

namespace Teapot.ViewModels;

public partial class MainWindowViewModel : ObservableObject
{
    // 服务依赖
    private readonly IWorkingRequestsService _workingRequestsService;
    private readonly IHistoryService _historyService;
    private readonly ICollectionService _collectionService;
    private readonly IEnvironmentService _environmentService;

    // Properties
    [ObservableProperty]
    private int _selectedTabIndex;

    // 工作区 - 当前正在编辑的请求
    public ObservableCollection<HttpRequestModel> WorkingRequests => _workingRequestsService.GetWorkingRequests();

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
        IEnvironmentService environmentService)
    {
        _workingRequestsService = workingRequestsService;
        _historyService = historyService;
        _collectionService = collectionService;
        _environmentService = environmentService;

        SelectedEnvironment = _environmentService.GetSelectedEnvironment();
    }

    // Commands
    public ICommand AddNewTabCommand => new RelayCommand(AddNewTab);
    public ICommand CloseTabCommand => new AsyncRelayCommand<TabViewTabCloseRequestedEventArgs>(CloseTab);
    public ICommand SaveToCollectionCommand => new RelayCommand<HttpRequestModel>(SaveToCollection);

    private void AddNewTab()
    {
        var newRequest = new HttpRequestModel
        {
            Name = $"Request {WorkingRequests.Count + 1}",
            Method = "GET",
            Url = "https://httpbin.org/get",
            QueryParameters = new List<Parameter>(),
            Headers = new List<Header>(),
            Body = "",
            BodyType = "none",
            Authentication = new Authentication
            {
                Type = "none",
                Username = "",
                Password = "",
                Token = ""
            }
        };

        _workingRequestsService.AddRequest(newRequest);
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
    private void SaveToCollection(HttpRequestModel? request)
    {
        if (request == null) return;

        _collectionService.AddToCollection(request);
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
        if (tabItem?.DataContext is HttpRequestModel request)
        {
            // 显示确认对话框
            var dialog = new ContentDialog
            {
                Title = "确认关闭",
                Content = $"确定要关闭请求 \"{request.Name}\" 吗？",
                PrimaryButtonText = "关闭",
                CloseButtonText = "取消",
                DefaultButton = ContentDialogButton.Primary
            };

            var result = await dialog.ShowAsync();

            // 用户确认后才删除
            if (result == ContentDialogResult.Primary)
            {
                _workingRequestsService.RemoveRequest(request);
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