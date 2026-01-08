using System;
using System.Collections.ObjectModel;
using System.Collections.Generic; // 添加这个using
using System.Linq;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Teapot.Models;
using Teapot.Models.Interfaces;

namespace Teapot.ViewModels;

public partial class MainWindowViewModel : ObservableObject
{
    private readonly IHttpService _httpService;

    // Properties
    [ObservableProperty]
    private HttpRequestModel _selectedRequest;
    
    [ObservableProperty]
    private HttpResponseModel _currentResponse;
    
    [ObservableProperty]
    private ObservableCollection<HttpRequestModel> _history;
    
    [ObservableProperty]
    private ObservableCollection<CollectionItemViewModel> _collections;
    
    [ObservableProperty]
    private CollectionItemViewModel _selectedCollection;
    
    [ObservableProperty]
    private ObservableCollection<EnvironmentModel> _environments;
    
    [ObservableProperty]
    private EnvironmentModel _selectedEnvironment;
    
    [ObservableProperty]
    private string _selectedPreRequestScriptCode = "";
    
    [ObservableProperty]
    private string _selectedTestScriptCode = "";

    public MainWindowViewModel(IHttpService httpService)
    {
        _httpService = httpService ?? throw new ArgumentNullException(nameof(httpService));
        
        // 初始化数据
        History = new ObservableCollection<HttpRequestModel>();
        Collections = new ObservableCollection<CollectionItemViewModel>();
        Environments = new ObservableCollection<EnvironmentModel>();
        
        // 添加示例数据
        var sampleRequest = new HttpRequestModel
        {
            Name = "Sample Request",
            Method = "GET",
            Url = "https://httpbin.org/get",
            QueryParameters = new List<Parameter> // 修改这里
            {
                new Parameter { IsActive = true, Key = "param1", Value = "value1" }
            },
            Headers = new List<Header> // 修改这里
            {
                new Header { IsActive = true, Key = "Content-Type", Value = "application/json" }
            },
            Body = "{\n  \"key\": \"value\"\n}",
            BodyType = "raw",
            Authentication = new Authentication
            {
                Type = "none", // 与Authentication类定义匹配
                Username = "",
                Password = "",
                Token = ""
            }
        };
        History.Add(sampleRequest);
        
        // 初始化环境
        Environments.Add(new EnvironmentModel
        {
            Name = "Default Environment",
            Variables = new ObservableCollection<EnvironmentVariable> // 修复：使用EnvironmentVariable而不是Parameter
            {
                new EnvironmentVariable { Key = "baseUrl", Value = "https://httpbin.org" }
            }
        });
        
        SelectedRequest = History[0];
        SelectedEnvironment = Environments[0];
        CurrentResponse = new HttpResponseModel();
        
        // 初始化其他属性
        HttpMethodOptions = new[] { "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS" };
        AuthTypes = new[] { "none", "Basic", "Bearer Token" }; // UI显示用的选项
        BodyTypes = new[] { "none", "raw", "form-data", "x-www-form-urlencoded" };
    }

    // Commands
    public ICommand SendRequestCommand => new AsyncRelayCommand<HttpRequestModel>(SendRequestAsync);
    public ICommand AddNewTabCommand => new RelayCommand(AddNewTab);

    // Lists and options
    public string[] HttpMethodOptions { get; }
    public string[] AuthTypes { get; }
    public string[] BodyTypes { get; }

    // Computed properties for UI state
    public bool IsAuthFieldsVisible => SelectedRequest?.Authentication?.Type != "none"; // 修改为与Authentication类定义匹配
    public bool IsBasicAuth => SelectedRequest?.Authentication?.Type == "Basic" || SelectedRequest?.Authentication?.Type == "basic"; // 支持两种格式
    public bool IsBearerToken => SelectedRequest?.Authentication?.Type == "Bearer Token" || SelectedRequest?.Authentication?.Type == "bearer"; // 支持两种格式
    public bool IsBodyVisible => SelectedRequest?.BodyType != "none";

    // Methods
    private async System.Threading.Tasks.Task SendRequestAsync(HttpRequestModel request)
    {
        if (request == null) return;

        try
        {
            // 显示加载状态
            // TODO: 添加加载指示器
            
            var response = await _httpService.SendRequestAsync(request);
            CurrentResponse = response;
        }
        catch (Exception ex)
        {
            // 显示错误消息
            CurrentResponse = new HttpResponseModel
            {
                StatusCode = 0,
                StatusDescription = "Error",
                Body = ex.Message,
                Headers = new ObservableCollection<ResponseHeader>(),
                Cookies = new List<Cookie>(), // 修复：使用List<Cookie>而不是ObservableCollection<Cookie>
                TestResults = new ObservableCollection<TestResult>()
            };
        }
    }

    private void AddNewTab()
    {
        var newRequest = new HttpRequestModel
        {
            Name = $"Request {History.Count + 1}",
            Method = "GET",
            Url = "https://httpbin.org/get",
            QueryParameters = new List<Parameter>(), // 修改这里
            Headers = new List<Header>(), // 修改这里
            Body = "",
            BodyType = "none",
            Authentication = new Authentication
            {
                Type = "none", // 与Authentication类定义匹配
                Username = "",
                Password = "",
                Token = ""
            }
        };
        
        History.Add(newRequest);
        SelectedRequest = newRequest;
    }
    
    partial void OnSelectedRequestChanged(HttpRequestModel value)
    {
        if (value != null)
        {
            // 修复：从Script列表中获取第一个脚本的代码
            SelectedPreRequestScriptCode = value.PreRequestScripts?.FirstOrDefault()?.Code ?? "";
            SelectedTestScriptCode = value.TestScripts?.FirstOrDefault()?.Code ?? "";
        }
    }
}