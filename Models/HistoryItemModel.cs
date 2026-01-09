using System;
using System.Collections.ObjectModel;

namespace Teapot.Models
{
    public class HistoryItemModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public HttpRequestModel Request { get; set; } = new HttpRequestModel();
        public HttpResponseModel Response { get; set; } = new HttpResponseModel();
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public bool IsSuccessful { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
}