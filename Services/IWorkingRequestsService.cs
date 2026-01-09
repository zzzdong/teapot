using System.Collections.ObjectModel;
using Teapot.Models;

namespace Teapot.Services
{
    /// <summary>
    /// 工作区请求服务接口
    /// </summary>
    public interface IWorkingRequestsService
    {
        ObservableCollection<HttpRequestModel> GetWorkingRequests();
        void AddRequest(HttpRequestModel request);
        void RemoveRequest(HttpRequestModel request);
        void ClearRequests();
        HttpRequestModel? GetRequestById(string id);
        void SaveRequests();
    }
}