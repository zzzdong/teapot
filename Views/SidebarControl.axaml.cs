using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Markup.Xaml;
using Teapot.Models;
using Teapot.ViewModels;

namespace Teapot.Views;

public partial class SidebarControl : UserControl
{
    public SidebarControl()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }

    private void CollectionsTreeView_DoubleTapped(object sender, TappedEventArgs e)
    {
        if (sender is TreeView treeView && treeView.SelectedItem is CollectionItemViewModel collectionItem)
        {
            // 只有请求类型才能被打开
            if (collectionItem.Type == CollectionItemType.Request && collectionItem.Request != null)
            {
                // 获取SidebarControlViewModel
                if (DataContext is SidebarControlViewModel viewModel)
                {
                    // 使用AddNewTabCommand，传入HttpRequestModel
                    viewModel.AddNewTabCommand.Execute(collectionItem.Request);
                }
            }
        }
    }

    private void HistoryListBox_DoubleTapped(object sender, TappedEventArgs e)
    {
        if (sender is ListBox listBox && listBox.SelectedItem is HistoryItemModel historyItem)
        {
            // 获取SidebarControlViewModel
            if (DataContext is SidebarControlViewModel viewModel)
            {
                // 使用AddNewTabCommand，传入HttpRequestModel
                viewModel.AddNewTabCommand.Execute(historyItem.Request);
            }
        }
    }

    private void AddDirectory_Click(object sender, RoutedEventArgs e)
    {
        // 新增文件夹的逻辑
        if (DataContext is SidebarControlViewModel viewModel)
        {
            viewModel.AddDirectoryCommand.Execute(null);
        }
    }

    private void AddRequest_Click(object sender, RoutedEventArgs e)
    {
        // 新增请求的逻辑
        if (DataContext is SidebarControlViewModel viewModel)
        {
            viewModel.AddRequestCommand.Execute(null);
        }
    }
}