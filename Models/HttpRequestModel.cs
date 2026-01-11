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
        partial void OnBodyTypeChanged(string value)
        {
            // 当BodyType为json时，自动添加Content-Type头为application/json
            if (value.Equals("json", StringComparison.OrdinalIgnoreCase))
            {
                // 检查是否已存在Content-Type头
                var contentTypeHeader = Headers.FirstOrDefault(h => h.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase));
                if (contentTypeHeader != null)
                {
                    // 如果存在，更新值
                    contentTypeHeader.Value = "application/json";
                }
                else
                {
                    // 如果不存在，添加新的Content-Type头
                    Headers.Add(new Header { Key = "Content-Type", Value = "application/json", IsActive = true });
                }
            }
        }

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