using System.Threading.Tasks;

namespace Teapot.Models.Interfaces
{
    public interface IHttpService
    {
        Task<HttpResponseModel> SendRequestAsync(HttpRequestModel request);
    }
}