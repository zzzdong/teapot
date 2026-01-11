using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using FluentAvalonia.UI.Controls;
using Teapot.Models;

namespace Teapot.ViewModels
{
    public partial class CollectionItemViewModel : ObservableObject
    {
        public CollectionItemViewModel(CollectionModel collection)
        {
            Id = Guid.NewGuid().ToString();
            Name = collection.Name;
            Type = CollectionItemType.Collection;
            Symbol = Symbol.BrowsePhotos;
            
            foreach (var request in collection.Requests)
            {
                Children.Add(new CollectionItemViewModel(request));
            }
            
            foreach (var folder in collection.Folders)
            {
                Children.Add(new CollectionItemViewModel(folder));
            }
        }

        public CollectionItemViewModel(FolderModel folder)
        {
            Id = Guid.NewGuid().ToString();
            Name = folder.Name;
            Type = CollectionItemType.Folder;
            Symbol = Symbol.Folder;
            
            foreach (var request in folder.Requests)
            {
                Children.Add(new CollectionItemViewModel(request));
            }
            
            foreach (var subFolder in folder.SubFolders)
            {
                Children.Add(new CollectionItemViewModel(subFolder));
            }
        }

        public CollectionItemViewModel(HttpRequestModel request)
        {
            Id = Guid.NewGuid().ToString();
            Name = request.Name;
            Type = CollectionItemType.Request;
            Request = request;
            Symbol = Symbol.Document;
        }

        public CollectionItemViewModel(string name, CollectionItemType type)
        {
            Id = Guid.NewGuid().ToString();
            Name = name;
            Type = type;
            
            switch (type)
            {
                case CollectionItemType.Collection:
                    Symbol = Symbol.BrowsePhotos;
                    break;
                case CollectionItemType.Folder:
                    Symbol = Symbol.Folder;
                    break;
                case CollectionItemType.Request:
                    Symbol = Symbol.Document;
                    break;
            }
        }

        public CollectionItemViewModel(string id, string name, CollectionItemType type)
        {
            Id = id;
            Name = name;
            Type = type;
            
            switch (type)
            {
                case CollectionItemType.Collection:
                    Symbol = Symbol.BrowsePhotos;
                    break;
                case CollectionItemType.Folder:
                    Symbol = Symbol.Folder;
                    break;
                case CollectionItemType.Request:
                    Symbol = Symbol.Document;
                    break;
            }
        }

        [ObservableProperty]
        private string _id = Guid.NewGuid().ToString();

        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
    private Symbol _symbol;

    [ObservableProperty]
    private CollectionItemType _type;

    public HttpRequestModel? Request { get; }

    public ObservableCollection<CollectionItemViewModel> Children { get; } = new();

    // 编辑相关属性
    [ObservableProperty]
    private bool _isEditing = false;

    [ObservableProperty]
    private string _editName = string.Empty;

    // 当Name属性改变时，同步更新EditName
    partial void OnNameChanged(string oldValue, string newValue)
    {
        EditName = newValue;
    }
    }

    public enum CollectionItemType
    {
        Collection,
        Folder,
        Request
    }
}