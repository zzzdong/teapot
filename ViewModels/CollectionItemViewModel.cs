using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using Teapot.Models;

namespace Teapot.ViewModels
{
    public partial class CollectionItemViewModel : ObservableObject
    {
        public CollectionItemViewModel(CollectionModel collection)
        {
            Name = collection.Name;
            Type = CollectionItemType.Collection;
            Icon = "avares://Teapot/Assets/Collection.png";
            
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
            Name = folder.Name;
            Type = CollectionItemType.Folder;
            Icon = "avares://Teapot/Assets/Folder.png";
            
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
            Name = request.Name;
            Type = CollectionItemType.Request;
            Request = request;
            Icon = "avares://Teapot/Assets/Request.png";
        }

        public CollectionItemViewModel(string name, CollectionItemType type)
        {
            Name = name;
            Type = type;
            
            switch (type)
            {
                case CollectionItemType.Collection:
                    Icon = "avares://Teapot/Assets/Collection.png";
                    break;
                case CollectionItemType.Folder:
                    Icon = "avares://Teapot/Assets/Folder.png";
                    break;
                case CollectionItemType.Request:
                    Icon = "avares://Teapot/Assets/Request.png";
                    break;
            }
        }

        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _icon = string.Empty;

        [ObservableProperty]
        private CollectionItemType _type;

        public HttpRequestModel? Request { get; }

        public ObservableCollection<CollectionItemViewModel> Children { get; } = new();
    }

    public enum CollectionItemType
    {
        Collection,
        Folder,
        Request
    }
}