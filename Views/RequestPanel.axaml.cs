using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using Microsoft.Extensions.DependencyInjection;
using System;
using Teapot.Models;
using Teapot.Services;
using Teapot.ViewModels;

namespace Teapot.Views
{
    public partial class RequestPanel : UserControl
    {
        public RequestPanel()
        {
            InitializeComponent();
        }
    }
}