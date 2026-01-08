using CommunityToolkit.Mvvm.ComponentModel;

namespace Teapot.Models
{
    public partial class Parameter : ObservableObject
    {
        [ObservableProperty]
        private string _key = string.Empty;

        [ObservableProperty]
        private string _value = string.Empty;

        [ObservableProperty]
        private bool _isActive = true;
    }
}