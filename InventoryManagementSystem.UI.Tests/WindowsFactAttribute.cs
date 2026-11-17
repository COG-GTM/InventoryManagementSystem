using System;
using Xunit;

namespace InventoryManagementSystem.UI.Tests
{
    public sealed class WindowsFactAttribute : FactAttribute
    {
        public WindowsFactAttribute()
        {
            if (!OperatingSystem.IsWindows())
            {
                Skip = "WinForms smoke tests run on Windows only.";
            }
        }
    }
}
