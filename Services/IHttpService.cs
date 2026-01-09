using System.Threading.Tasks;
using Teapot.Models;

namespace Teapot.Services
{
    public interface IHttpService
    {
        Task<HttpResponseModel> SendRequestAsync(HttpRequestModel request);
    }
}