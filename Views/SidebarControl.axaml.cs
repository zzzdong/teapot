using Avalonia.Controls;
using Avalonia.Markup.Xaml;

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
}