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
    private readonly ICollectionService _collectionService;
    private readonly IRequestPanelViewModelFactory _factory;

    // Properties
    [ObservableProperty]
    private int _selectedTabIndex;

    // Sidebar ViewModel
    public SidebarControlViewModel SidebarViewModel { get; }

    // 环境 - 从 SidebarViewModel 获取
    public ObservableCollection<EnvironmentModel> Environments => SidebarViewModel.Environments;

    // 选中的环境 - 从 SidebarViewModel 获取
    public EnvironmentModel? SelectedEnvironment
    {
        get => SidebarViewModel.SelectedEnvironment;
        set => SidebarViewModel.SelectedEnvironment = value;
    }

    // 工作区 - 当前正在编辑的请求
    public ObservableCollection<RequestPanelViewModel> WorkingRequests => _workingRequestsService.GetWorkingRequests();

    public MainWindowViewModel(
        IWorkingRequestsService workingRequestsService,
        ICollectionService collectionService,
        IRequestPanelViewModelFactory factory,
        SidebarControlViewModel sidebarViewModel)
    {
        _workingRequestsService = workingRequestsService;
        _collectionService = collectionService;
        _factory = factory;
        SidebarViewModel = sidebarViewModel;
    }

    // Commands
    public ICommand AddNewTabCommand => new RelayCommand<HttpRequestModel>(AddNewTab);
    public ICommand CloseTabCommand => new AsyncRelayCommand<TabViewTabCloseRequestedEventArgs>(CloseTab);
    public ICommand SaveToCollectionCommand => new RelayCommand<RequestPanelViewModel>(SaveToCollection);

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