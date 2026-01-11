using Microsoft.Extensions.DependencyInjection;
using Teapot.Models;
using Teapot.Services;
using Teapot.ViewModels;

namespace Teapot.Services
{
    public class RequestPanelViewModelFactory : IRequestPanelViewModelFactory
    {
        private readonly IServiceProvider _serviceProvider;

        public RequestPanelViewModelFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public RequestPanelViewModel Create(HttpRequestModel request)
        {
            var httpService = _serviceProvider.GetService<IHttpService>();
            var historyService = _serviceProvider.GetService<IHistoryService>();
            var jsonService = _serviceProvider.GetService<IJsonService>();
            var collectionService = _serviceProvider.GetService<ICollectionService>();

            return new RequestPanelViewModel(request, httpService, historyService, jsonService, collectionService);
        }
    }
}