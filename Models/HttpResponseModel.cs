using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Teapot.Models
{
    public partial class HttpResponseModel : ObservableObject
    {
        [ObservableProperty]
        private string _requestId = string.Empty;

        [ObservableProperty]
        private int _statusCode;

        [ObservableProperty]
        private string _statusDescription = string.Empty;

        [ObservableProperty]
        private ObservableCollection<ResponseHeader> _headers = new();

        [ObservableProperty]
        private string _body = string.Empty;

        [ObservableProperty]
        private string _contentType = string.Empty;

        [ObservableProperty]
        private long _contentLength;

        [ObservableProperty]
        private TimeSpan _responseTime;

        [ObservableProperty]
        private List<Cookie> _cookies = new();

        [ObservableProperty]
        private ObservableCollection<TestResult> _testResults = new();

        public HttpResponseModel()
        {
            // 构造函数保持简单，不需要从HeadersDict同步到Headers列表
        }

        // 保留原始字典以向后兼容
        public Dictionary<string, string> HeadersDict { get; set; } = new();
    }

    public partial class ResponseHeader : ObservableObject
    {
        [ObservableProperty]
        private string _key = string.Empty;

        [ObservableProperty]
        private string _value = string.Empty;
    }

    public partial class Cookie : ObservableObject
    {
        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _value = string.Empty;

        [ObservableProperty]
        private string _domain = string.Empty;

        [ObservableProperty]
        private string _path = "/";

        [ObservableProperty]
        private DateTime _expires = DateTime.MinValue;

        [ObservableProperty]
        private bool _secure = false;

        [ObservableProperty]
        private bool _httpOnly = false;
    }

    public partial class TestResult : ObservableObject
    {
        [ObservableProperty]
        private string _testName = string.Empty;

        [ObservableProperty]
        private bool _passed = false;

        [ObservableProperty]
        private string _message = string.Empty;
    }
}