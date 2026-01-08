using System;
using System.Collections.Generic;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Teapot.Models
{
    public partial class HttpRequestModel : ObservableObject
    {
        [ObservableProperty]
        private string _id = Guid.NewGuid().ToString();

        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _method = "GET";

        [ObservableProperty]
        private string _url = string.Empty;

        [ObservableProperty]
        private List<Parameter> _queryParameters = new();

        [ObservableProperty]
        private List<Header> _headers = new();

        [ObservableProperty]
        private string _bodyType = "none";

        [ObservableProperty]
        private string _body = string.Empty;

        [ObservableProperty]
        private Authentication _authentication = new();

        [ObservableProperty]
        private List<Script> _preRequestScripts = new();

        [ObservableProperty]
        private List<Script> _testScripts = new();
    }

    public partial class Script : ObservableObject
    {
        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _code = string.Empty;

        [ObservableProperty]
        private bool _isActive = true;
    }
}