using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections.Generic;

namespace Teapot.Models
{
    public partial class JsonTreeNode : ObservableObject
    {
        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _value = string.Empty;

        [ObservableProperty]
        private string _type = string.Empty;

        [ObservableProperty]
        private bool _isExpanded = true;

        [ObservableProperty]
        private List<JsonTreeNode> _children = new();

        [ObservableProperty]
        private bool _hasChildren;
    }
}