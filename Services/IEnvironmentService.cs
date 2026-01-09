using System.Collections.ObjectModel;
using Teapot.Models;

namespace Teapot.Services
{
    /// <summary>
    /// 环境服务接口
    /// </summary>
    public interface IEnvironmentService
    {
        ObservableCollection<EnvironmentModel> GetEnvironments();
        void AddEnvironment(EnvironmentModel environment);
        void RemoveEnvironment(EnvironmentModel environment);
        void UpdateEnvironment(EnvironmentModel environment);
        EnvironmentModel? GetSelectedEnvironment();
        void SetSelectedEnvironment(EnvironmentModel environment);
    }
}
