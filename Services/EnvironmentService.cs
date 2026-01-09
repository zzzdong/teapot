using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;
using Teapot.Models;

namespace Teapot.Services
{
    /// <summary>
    /// 环境服务实现
    /// </summary>
    public class EnvironmentService : IEnvironmentService
    {
        private readonly ObservableCollection<EnvironmentModel> _environments;
        private EnvironmentModel? _selectedEnvironment;
        private readonly string _dataFilePath;

        public EnvironmentService()
        {
            _environments = new ObservableCollection<EnvironmentModel>();
            _dataFilePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "teapot_environments.json");

            LoadEnvironments();
        }

        public ObservableCollection<EnvironmentModel> GetEnvironments()
        {
            return _environments;
        }

        public void AddEnvironment(EnvironmentModel environment)
        {
            _environments.Add(environment);
            if (_selectedEnvironment == null)
            {
                _selectedEnvironment = environment;
            }
            SaveEnvironments();
        }

        public void RemoveEnvironment(EnvironmentModel environment)
        {
            if (_selectedEnvironment == environment)
            {
                _selectedEnvironment = null;
            }
            _environments.Remove(environment);
            SaveEnvironments();
        }

        public void UpdateEnvironment(EnvironmentModel environment)
        {
            SaveEnvironments();
        }

        public EnvironmentModel? GetSelectedEnvironment()
        {
            return _selectedEnvironment;
        }

        public void SetSelectedEnvironment(EnvironmentModel environment)
        {
            _selectedEnvironment = environment;
            SaveEnvironments();
        }

        private void LoadEnvironments()
        {
            if (File.Exists(_dataFilePath))
            {
                try
                {
                    var json = File.ReadAllText(_dataFilePath);
                    var envList = JsonSerializer.Deserialize<List<EnvironmentModel>>(json);
                    if (envList != null)
                    {
                        _environments.Clear();
                        foreach (var env in envList)
                        {
                            _environments.Add(env);
                        }
                        if (envList.Count > 0)
                        {
                            _selectedEnvironment = envList[0];
                        }
                    }
                }
                catch
                {
                    // 加载失败时使用默认环境
                }
            }
            else
            {
                // 首次启动时添加默认环境
                AddDefaultEnvironment();
            }
        }

        private void AddDefaultEnvironment()
        {
            var defaultEnv = new EnvironmentModel
            {
                Name = "Default Environment",
                Variables = new ObservableCollection<EnvironmentVariable>
                {
                    new EnvironmentVariable { Key = "baseUrl", Value = "https://httpbin.org" }
                }
            };
            _environments.Add(defaultEnv);
            _selectedEnvironment = defaultEnv;
            SaveEnvironments();
        }

        private void SaveEnvironments()
        {
            try
            {
                var data = new
                {
                    Environments = _environments.ToList(),
                    SelectedEnvironmentId = _selectedEnvironment?.Id
                };
                var json = JsonSerializer.Serialize(data);
                File.WriteAllText(_dataFilePath, json);
            }
            catch
            {
                // 保存失败时忽略
            }
        }

        private class EnvironmentData
        {
            public List<EnvironmentModel> Environments { get; set; } = new();
            public string? SelectedEnvironmentId { get; set; }
        }
    }
}
