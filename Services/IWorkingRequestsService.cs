using System.Collections.ObjectModel;
using FluentAvalonia.UI.Controls;
using Teapot.Models;
using Teapot.ViewModels;

namespace Teapot.Services
{
    /// <summary>
    /// 工作区请求服务接口
    /// </summary>
    public interface IWorkingRequestsService
    {
        ObservableCollection<RequestPanelViewModel> GetWorkingRequests();
        void AddRequest(RequestPanelViewModel request);
        void RemoveRequest(RequestPanelViewModel request);
        void ClearRequests();
        RequestPanelViewModel? GetRequestById(string id);
        void SaveRequests();
    }
}