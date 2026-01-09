using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;
using Teapot.Models;
using Teapot.ViewModels;

namespace Teapot.Services
{
    /// <summary>
    /// 收藏夹服务实现
    /// </summary>
    public class CollectionService : ICollectionService
    {
        private readonly ObservableCollection<CollectionItemViewModel> _collections;
        private readonly string _dataFilePath;

        public CollectionService()
        {
            _collections = new ObservableCollection<CollectionItemViewModel>();
            _dataFilePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "teapot_collections.json");

            LoadCollections();
        }

        public ObservableCollection<CollectionItemViewModel> GetCollections()
        {
            return _collections;
        }

        public void AddToCollection(HttpRequestModel request)
        {
            var collectionItem = new CollectionItemViewModel(request);
            _collections.Add(collectionItem);
            SaveCollections();
        }

        // 修复此方法，改为接收HttpRequestModel而不是CollectionModel
        public void AddCollection(HttpRequestModel request)
        {
            var collectionItem = new CollectionItemViewModel(request);
            _collections.Add(collectionItem);
            SaveCollections();
        }

        public void RemoveFromCollection(CollectionItemViewModel item)
        {
            _collections.Remove(item);
            SaveCollections();
        }

        public void ClearCollections()
        {
            _collections.Clear();
            SaveCollections();
        }

        private void LoadCollections()
        {
            if (File.Exists(_dataFilePath))
            {
                try
                {
                    var json = File.ReadAllText(_dataFilePath);
                    var items = JsonSerializer.Deserialize<List<CollectionItemData>>(json);
                    if (items != null)
                    {
                        _collections.Clear();
                        foreach (var item in items)
                        {
                            var collectionItem = item.Type == "Request"
                                ? new CollectionItemViewModel(item.Request!) // 传入HttpRequestModel
                                : new CollectionItemViewModel(item.Name, CollectionItemType.Request); // 传入字符串和类型
                            _collections.Add(collectionItem);
                        }
                    }
                }
                catch
                {
                    // 加载失败时使用空集合
                }
            }
        }

        private void SaveCollections()
        {
            try
            {
                var data = _collections.Select(item => new CollectionItemData
                {
                    Name = item.Name,
                    Icon = item.Icon,
                    Type = item.Type.ToString(),
                    Request = item.Request
                }).ToList();
                var json = JsonSerializer.Serialize(data);
                File.WriteAllText(_dataFilePath, json);
            }
            catch
            {
                // 保存失败时忽略
            }
        }
    }

    /// <summary>
    /// 用于 JSON 序列化的收藏夹项数据
    /// </summary>
    public class CollectionItemData
    {
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Type { get; set; } = "Request";
        public HttpRequestModel? Request { get; set; }
    }
}