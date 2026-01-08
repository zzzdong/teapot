using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace Teapot.Models
{
    public partial class EnvironmentModel : ObservableObject
    {
        [ObservableProperty]
        private string _id = Guid.NewGuid().ToString();

        [ObservableProperty]
        private string _name = string.Empty;

        [ObservableProperty]
        private string _description = string.Empty;

        [ObservableProperty]
        private ObservableCollection<EnvironmentVariable> _variables = new();

        [ObservableProperty]
        private EnvironmentScope _scope = EnvironmentScope.Global;

        [ObservableProperty]
        private string _parentId = string.Empty;

        [ObservableProperty]
        private List<EnvironmentModel> _childEnvironments = new();

        public EnvironmentModel()
        {
            // 将字典转换为可绑定的集合
            if (VariablesDict != null)
            {
                foreach (var kvp in VariablesDict)
                {
                    Variables.Add(new EnvironmentVariable { Key = kvp.Key, Value = kvp.Value });
                }
            }
        }

        // 保留原始字典以向后兼容
        public Dictionary<string, string> VariablesDict { get; set; } = new();
    }

    public partial class EnvironmentVariable : ObservableObject
    {
        [ObservableProperty]
        private string _key = string.Empty;

        [ObservableProperty]
        private string _value = string.Empty;
    }

    public enum EnvironmentScope
    {
        Global,
        Collection,
        Request
    }
}