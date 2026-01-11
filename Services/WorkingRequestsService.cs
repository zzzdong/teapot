using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;
using FluentAvalonia.UI.Controls;
using Teapot.Models;
using Teapot.ViewModels;
using Teapot.Views;

namespace Teapot.Services
{
    /// <summary>
    /// 工作区请求服务实现
    /// </summary>
    public class WorkingRequestsService : IWorkingRequestsService
    {
        private readonly ObservableCollection<RequestPanelViewModel> _requests;
        private readonly string _dataFilePath;
        private readonly IRequestPanelViewModelFactory _factory;

        public WorkingRequestsService(IRequestPanelViewModelFactory factory)
        {
            _requests = new ObservableCollection<RequestPanelViewModel>();
            _dataFilePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "teapot_working.json");
            _factory = factory;

            LoadRequests();
        }

        public ObservableCollection<RequestPanelViewModel> GetWorkingRequests()
        {
            return _requests;
        }

        public void AddRequest(RequestPanelViewModel request)
        {
            _requests.Add(request);
            SaveRequests();
        }

        public void RemoveRequest(RequestPanelViewModel request)
        {
            _requests.Remove(request);
            SaveRequests();
        }

        public void ClearRequests()
        {
            _requests.Clear();
            SaveRequests();
        }

        public RequestPanelViewModel? GetRequestById(string id)     
        {
            return _requests.FirstOrDefault(r => r.Request.Id == id);
        }

        public void SaveRequests()  // 改为公共方法
        {
            try
            {
                // 保存时只保存HttpRequestModel，不保存UI元素
                var requestModels = _requests.Select(viewModel => viewModel.Request).ToList();
                var json = JsonSerializer.Serialize(requestModels);
                File.WriteAllText(_dataFilePath, json);
            }
            catch
            {
                // 保存失败时忽略
            }
        }

        private void LoadRequests()
        {
            if (File.Exists(_dataFilePath))
            {
                try
                {
                    var json = File.ReadAllText(_dataFilePath);
                    var items = JsonSerializer.Deserialize<List<HttpRequestModel>>(json);
                    if (items != null && items.Count > 0)
                    {
                        _requests.Clear();
                        foreach (var item in items)
                        {
                            _requests.Add(_factory.Create(item));
                        }
                    }
                    else
                    {
                        // 如果文件存在但内容为空，添加示例请求
                        AddSampleRequest();
                    }
                }
                catch
                {
                    // 加载失败时添加示例请求
                    _requests.Clear();
                    AddSampleRequest();
                }
            }
            else
            {
                // 首次启动时添加示例请求
                AddSampleRequest();
            }
        }

        private void AddSampleRequest()
        {
            var sampleRequest = new HttpRequestModel
            {
                Name = "Sample Request",
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
            _requests.Add(_factory.Create(sampleRequest));
        }
    }
}
