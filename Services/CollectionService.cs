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
            // 检查是否已存在具有相同Id的请求
            var existingItem = _collections.FirstOrDefault(item => 
                item.Type == CollectionItemType.Request && 
                item.Request != null &&
                item.Request.Id == request.Id);
            
            if (existingItem != null)
            {
                // 如果已存在，更新现有项
                existingItem.Name = request.Name;
                // 更新请求内容
                // 注意：由于CollectionItemViewModel.Request是只读的，我们需要重新创建CollectionItemViewModel
                var index = _collections.IndexOf(existingItem);
                _collections[index] = new CollectionItemViewModel(request);
            }
            else
            {
                // 如果不存在，添加新项
                var collectionItem = new CollectionItemViewModel(request);
                _collections.Add(collectionItem);
            }
            
            SaveCollections();
        }

        public void AddToCollection(CollectionItemViewModel item)
        {
            // 检查是否已存在具有相同Id的项
            var existingItem = _collections.FirstOrDefault(i => i.Id == item.Id);
            
            if (existingItem != null)
            {
                // 如果已存在，更新现有项
                existingItem.Name = item.Name;
            }
            else
            {
                // 如果不存在，添加新项
                _collections.Add(item);
            }
            
            SaveCollections();
        }

        // 修复此方法，改为接收HttpRequestModel而不是CollectionModel
        public void AddCollection(HttpRequestModel request)
        {
            // 检查是否已存在具有相同Id的请求
            var existingItem = _collections.FirstOrDefault(item => 
                item.Type == CollectionItemType.Request && 
                item.Request != null &&
                item.Request.Id == request.Id);
            
            if (existingItem != null)
            {
                // 如果已存在，更新现有项
                existingItem.Name = request.Name;
                // 更新请求内容
                // 注意：由于CollectionItemViewModel.Request是只读的，我们需要重新创建CollectionItemViewModel
                var index = _collections.IndexOf(existingItem);
                _collections[index] = new CollectionItemViewModel(request);
            }
            else
            {
                // 如果不存在，添加新项
                var collectionItem = new CollectionItemViewModel(request);
                _collections.Add(collectionItem);
            }
            
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
                            CollectionItemViewModel collectionItem;
                            
                            if (item.Type == "Request" && item.Request != null)
                            {
                                // 创建请求类型的项，并设置ID
                                collectionItem = new CollectionItemViewModel(item.Request);
                                collectionItem.Id = item.Id;
                            }
                            else
                            {
                                // 使用带有ID参数的构造函数创建其他类型的项
                                collectionItem = new CollectionItemViewModel(
                                    item.Id,
                                    item.Name,
                                    Enum.TryParse<CollectionItemType>(item.Type, out var type) ? type : CollectionItemType.Request
                                );
                            }
                            
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

        public void SaveCollections()
    {
        try
        {
            // 加载现有数据
            var existingItems = new Dictionary<string, CollectionItemData>();
            if (File.Exists(_dataFilePath))
            {
                var json = File.ReadAllText(_dataFilePath);
                var items = JsonSerializer.Deserialize<List<CollectionItemData>>(json);
                if (items != null)
                {
                    existingItems = items.ToDictionary(item => item.Id);
                }
            }
            
            // 转换当前集合项
            var currentItems = _collections.Select(item => new CollectionItemData
            {
                Id = item.Id,
                Name = item.Name,
                Type = item.Type.ToString(),
                Request = item.Request
            });
            
            // 根据ID合并数据：新增或更新
            foreach (var item in currentItems)
            {
                existingItems[item.Id] = item;
            }
            
            // 保存合并后的数据
            var jsonResult = JsonSerializer.Serialize(existingItems.Values.ToList());
            File.WriteAllText(_dataFilePath, jsonResult);
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
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "Request";
        public HttpRequestModel? Request { get; set; }
    }
}