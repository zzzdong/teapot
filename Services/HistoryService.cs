using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;
using Teapot.Models;

namespace Teapot.Services
{
    /// <summary>
    /// 历史记录服务实现
    /// </summary>
    public class HistoryService : IHistoryService
    {
        private readonly ObservableCollection<HistoryItemModel> _history;
        private readonly string _dataFilePath;

        public HistoryService()
        {
            _history = new ObservableCollection<HistoryItemModel>();
            _dataFilePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "teapot_history.json");

            LoadHistory();
        }

        public ObservableCollection<HistoryItemModel> GetHistory()
        {
            return _history;
        }

        public void AddToHistory(HistoryItemModel item)
        {
            _history.Insert(0, item); // 插入到开头
            SaveHistory();
        }

        public void ClearHistory()
        {
            _history.Clear();
            SaveHistory();
        }

        public void RemoveHistoryItem(HistoryItemModel item)
        {
            _history.Remove(item);
            SaveHistory();
        }

        private void LoadHistory()
        {
            if (File.Exists(_dataFilePath))
            {
                try
                {
                    var json = File.ReadAllText(_dataFilePath);
                    var items = JsonSerializer.Deserialize<List<HistoryItemModel>>(json);
                    if (items != null)
                    {
                        _history.Clear();
                        foreach (var item in items)
                        {
                            _history.Add(item);
                        }
                    }
                }
                catch
                {
                    // 加载失败时使用空历史
                }
            }
        }

        private void SaveHistory()
        {
            try
            {
                var json = JsonSerializer.Serialize(_history.ToList());
                File.WriteAllText(_dataFilePath, json);
            }
            catch
            {
                // 保存失败时忽略
            }
        }
    }
}
