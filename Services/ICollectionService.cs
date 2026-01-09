using System.Collections.ObjectModel;
using Teapot.Models;
using Teapot.ViewModels;

namespace Teapot.Services;

public interface ICollectionService
{
    ObservableCollection<CollectionItemViewModel> GetCollections();
    void AddToCollection(HttpRequestModel request);
    void AddCollection(HttpRequestModel request); // 修改参数类型
    void RemoveFromCollection(CollectionItemViewModel item);
    void ClearCollections();
}
