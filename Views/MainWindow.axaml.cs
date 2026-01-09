using Avalonia.Controls;
using Avalonia.Interactivity;
using FluentAvalonia.UI.Controls;
using Teapot.ViewModels;

namespace Teapot.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            
            // 设置关闭选项
            Closing += OnClosing;
        }

        private void OnClosing(object? sender, WindowClosingEventArgs e)
        {
            // 保存当前工作区请求
            if (DataContext is MainWindowViewModel vm)
            {
                vm.SaveWorkingRequests();
            }
        }
    }
}