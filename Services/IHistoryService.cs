using System.Collections.ObjectModel;
using Teapot.Models;

namespace Teapot.Services
{
    /// <summary>
    /// 历史记录服务接口
    /// </summary>
    public interface IHistoryService
    {
        ObservableCollection<HistoryItemModel> GetHistory();
        void AddToHistory(HistoryItemModel item);
        void ClearHistory();
        void RemoveHistoryItem(HistoryItemModel item);
    }
}
