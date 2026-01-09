using Teapot.Models;
using Teapot.ViewModels;

namespace Teapot.Services
{
    public interface IRequestPanelViewModelFactory
    {
        RequestPanelViewModel Create(HttpRequestModel request);
    }
}