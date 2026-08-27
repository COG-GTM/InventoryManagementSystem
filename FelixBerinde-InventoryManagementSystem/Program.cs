using System;
using System.Windows.Forms;

namespace FelixBerinde_InventoryManagementSystem
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();
            Application.Run(new MainScreen());
        }
    }
}
