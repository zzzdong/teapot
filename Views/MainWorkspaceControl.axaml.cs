using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace Teapot.Views;

public partial class MainWorkspaceControl : UserControl
{
    public MainWorkspaceControl()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}