using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Input;
using Avalonia.Controls;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using FluentAvalonia.UI.Controls;
using Teapot.Models;
using Teapot.Services;
using Teapot.Views;

namespace Teapot.ViewModels
{
    public partial class RequestPanelViewModel : ObservableObject
    {
        private readonly IHttpService? _httpService;
        private readonly IHistoryService? _historyService;
        private readonly ICollectionService? _collectionService;

        public RequestPanelViewModel(HttpRequestModel request, IHttpService? httpService, IHistoryService? historyService, ICollectionService? collectionService = null)
        {
            Request = request ?? throw new ArgumentNullException(nameof(request));
            _httpService = httpService;
            _historyService = historyService;
            _collectionService = collectionService;
            CurrentResponse = new HttpResponseModel();
            SendRequestCommand = new AsyncRelayCommand<HttpRequestModel>(SendRequestAsync);
            SaveToCollectionCommand = new RelayCommand<HttpRequestModel>((req) => SaveCurrentRequestToCollection());
        }

        [ObservableProperty]
        private HttpRequestModel _request;

        [ObservableProperty]
        private HttpResponseModel _currentResponse;

        public ICommand SendRequestCommand { get; }
        public ICommand SaveToCollectionCommand { get; }

        // Lists and options
        public string[] HttpMethodOptions => HttpConstants.Methods;
        public string[] AuthTypes => HttpConstants.AuthTypes;
        public string[] BodyTypes => HttpConstants.BodyTypes;

        // Script codes for UI binding
        public string SelectedPreRequestScriptCode
        {
            get => Request.PreRequestScripts?.FirstOrDefault()?.Code ?? "";
            set
            {
                if (Request.PreRequestScripts != null && Request.PreRequestScripts.Count > 0)
                {
                    Request.PreRequestScripts[0].Code = value;
                }
                else
                {
                    if (Request.PreRequestScripts == null)
                    {
                        Request.PreRequestScripts = new System.Collections.Generic.List<Script>();
                    }
                    Request.PreRequestScripts.Add(new Script { Code = value });
                }
                OnPropertyChanged();
            }
        }

        public string SelectedTestScriptCode
        {
            get => Request.TestScripts?.FirstOrDefault()?.Code ?? "";
            set
            {
                if (Request.TestScripts != null && Request.TestScripts.Count > 0)
                {
                    Request.TestScripts[0].Code = value;
                }
                else
                {
                    if (Request.TestScripts == null)
                    {
                        Request.TestScripts = new System.Collections.Generic.List<Script>();
                    }
                    Request.TestScripts.Add(new Script { Code = value });
                }
                OnPropertyChanged();
            }
        }

        // Computed properties for UI state
        public bool IsAuthFieldsVisible => Request?.Authentication?.Type != "none";
        public bool IsBasicAuth => Request?.Authentication?.Type == "Basic" || Request?.Authentication?.Type == "basic";
        public bool IsBearerToken => Request?.Authentication?.Type == "Bearer Token" || Request?.Authentication?.Type == "bearer";
        public bool IsBodyVisible => Request?.BodyType != "none";

        // Methods
        private async Task SendRequestAsync(HttpRequestModel? request)
        {
            if (request == null || _httpService == null) return;

            HttpResponseModel response;
            bool isSuccessful = false;
            string errorMessage = string.Empty;

            try
            {
                response = await _httpService.SendRequestAsync(request);
                CurrentResponse = response;
                isSuccessful = response.StatusCode >= 200 && response.StatusCode < 300;
            }
            catch (Exception ex)
            {
                response = new HttpResponseModel
                {
                    StatusCode = 0,
                    StatusDescription = "Error",
                    Body = ex.Message,
                    Headers = new ObservableCollection<ResponseHeader>(),
                    Cookies = new List<Cookie>(),
                    TestResults = new ObservableCollection<TestResult>()
                };
                CurrentResponse = response;
                errorMessage = ex.Message;
            }

            // 添加到历史记录
            if (_historyService != null)
            {
                var historyItem = new HistoryItemModel
                {
                    Request = request,
                    Response = response,
                    IsSuccessful = isSuccessful,
                    ErrorMessage = errorMessage,
                    Timestamp = DateTime.Now
                };
                _historyService.AddToHistory(historyItem);
            }
        }

        private void SaveCurrentRequestToCollection()
        {
            if (_collectionService != null && Request != null)
            {
                _collectionService.AddToCollection(Request);
            }
        }
    }
}