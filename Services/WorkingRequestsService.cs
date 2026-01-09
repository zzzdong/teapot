using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;
using Teapot.Models;

namespace Teapot.Services
{
    /// <summary>
    /// 工作区请求服务实现
    /// </summary>
    public class WorkingRequestsService : IWorkingRequestsService
    {
        private readonly ObservableCollection<HttpRequestModel> _requests;
        private readonly string _dataFilePath;

        public WorkingRequestsService()
        {
            _requests = new ObservableCollection<HttpRequestModel>();
            _dataFilePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "teapot_working.json");

            LoadRequests();
        }

        public ObservableCollection<HttpRequestModel> GetWorkingRequests()
        {
            return _requests;
        }

        public void AddRequest(HttpRequestModel request)
        {
            _requests.Add(request);
            SaveRequests();
        }

        public void RemoveRequest(HttpRequestModel request)
        {
            _requests.Remove(request);
            SaveRequests();
        }

        public void ClearRequests()
        {
            _requests.Clear();
            SaveRequests();
        }

        public HttpRequestModel? GetRequestById(string id)
        {
            return _requests.FirstOrDefault(r => r.Id == id);
        }

        public void SaveRequests()  // 改为公共方法
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

        private void LoadRequests()
        {
            if (File.Exists(_dataFilePath))
            {
                try
                {
                    var json = File.ReadAllText(_dataFilePath);
                    var items = JsonSerializer.Deserialize<List<HttpRequestModel>>(json);
                    if (items != null)
                    {
                        _requests.Clear();
                        foreach (var item in items)
                        {
                            _requests.Add(item);
                        }
                    }
                }
                catch
                {
                    // 加载失败时使用空集合
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
                    new Parameter { IsActive = true, Key = "param1", Value = "value1" }
                },
                Headers = new List<Header>
                {
                    new Header { IsActive = true, Key = "Content-Type", Value = "application/json" }
                },
                Body = "{\n  \"key\": \"value\"\n}",
                BodyType = "raw",
                Authentication = new Authentication
                {
                    Type = "none",
                    Username = "",
                    Password = "",
                    Token = ""
                }
            };
            _requests.Add(sampleRequest);
        }
    }
}
