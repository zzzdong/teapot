using CommunityToolkit.Mvvm.ComponentModel;

namespace Teapot.Models
{
    public partial class Authentication : ObservableObject
    {
        [ObservableProperty]
        private string _type = "none";

        [ObservableProperty]
        private string _username = string.Empty;

        [ObservableProperty]
        private string _password = string.Empty;

        [ObservableProperty]
        private string _token = string.Empty;
    }
}