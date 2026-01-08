using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace Teapot.Views;

public partial class AuxiliaryPanelControl : UserControl
{
    public AuxiliaryPanelControl()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        AvaloniaXamlLoader.Load(this);
    }
}