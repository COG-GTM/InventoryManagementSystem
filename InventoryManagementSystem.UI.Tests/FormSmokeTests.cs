using System;
using System.Drawing;
using System.Reflection;
using System.Runtime.ExceptionServices;
using System.Threading;
using System.Windows.Forms;
using FelixBerinde_InventoryManagementSystem;
using FelixBerinde_InventoryManagementSystem.model;
using Xunit;

namespace InventoryManagementSystem.UI.Tests
{
    [Collection("WinForms")]
    public class FormSmokeTests
    {
        [WindowsFact]
        public void Forms_construct_and_validation_paths_are_reachable()
        {
            RunSta(() =>
            {
                Inventory.AllParts.Clear();
                Inventory.Products.Clear();
                Inventory.ranFakeData = false;

                InitializeApplicationConfiguration();

                using var mainScreen = new MainScreen();
                using var addPart = new AddPart();
                using var addProduct = new AddProduct();
                using var modPart = new ModPart(new Inhouse { PartID = 1, Name = "Part" });
                using var modProduct = new ModProduct(new Product { ProductID = 1, Name = "Product" });

                Assert.Equal(HighDpiMode.PerMonitorV2, Application.HighDpiMode);
                Assert.True(Application.UseVisualStyles);
                foreach (Form form in new Form[] { mainScreen, addPart, modPart, addProduct, modProduct })
                {
                    Assert.Equal("Microsoft Sans Serif", form.Font.FontFamily.Name);
                    Assert.Equal(8.25f, form.Font.SizeInPoints);
                }

                Assert.Equal("Microsoft Sans Serif", mainScreen.Font.FontFamily.Name);
                Assert.Equal(8.25f, mainScreen.Font.SizeInPoints);
                Assert.Equal(new Size(1184, 561), mainScreen.ClientSize);
                Assert.Equal(new Size(464, 441), addPart.ClientSize);
                Assert.Equal(new Size(1184, 861), addProduct.ClientSize);
                Assert.Equal(new Size(464, 441), modPart.ClientSize);
                Assert.Equal(new Size(1184, 861), modProduct.ClientSize);

                Invoke(mainScreen, "MainScreen_Load");
                Assert.NotEmpty(Inventory.AllParts);
                Assert.NotEmpty(Inventory.Products);

                SetText(addPart, "nameBox", string.Empty);
                Invoke(addPart, "nameBox_TextChanged");
                Assert.False(GetControl<Button>(addPart, "saveBtn").Enabled);

                SetText(addProduct, "nameBox", string.Empty);
                Invoke(addProduct, "nameBox_TextChanged");
                Assert.False(GetControl<Button>(addProduct, "saveBtn").Enabled);
            });
        }

        internal static void RunSta(Action action)
        {
            Exception failure = null;
            var thread = new Thread(() =>
            {
                try
                {
                    InitializeApplicationConfiguration();
                    action();
                }
                catch (Exception exception) { failure = exception; }
            }) { IsBackground = true };
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            Assert.True(thread.Join(TimeSpan.FromSeconds(30)), "STA form test timed out.");
            if (failure != null)
                ExceptionDispatchInfo.Capture(failure).Throw();
        }

        private static void InitializeApplicationConfiguration()
        {
            Type configurationType = typeof(MainScreen).Assembly.GetType("FelixBerinde_InventoryManagementSystem.ApplicationConfiguration");
            MethodInfo initialize = configurationType?.GetMethod("Initialize", BindingFlags.Static | BindingFlags.Public);
            Assert.NotNull(initialize);
            initialize.Invoke(null, null);
        }

        private static void Invoke(object instance, string methodName)
        {
            instance.GetType().GetMethod(methodName, BindingFlags.Instance | BindingFlags.NonPublic)
                .Invoke(instance, new object[] { instance, EventArgs.Empty });
        }

        private static void SetText(object instance, string fieldName, string value)
        {
            GetControl<TextBox>(instance, fieldName).Text = value;
        }

        private static T GetControl<T>(object instance, string fieldName) where T : Control
        {
            return (T)instance.GetType().GetField(fieldName, BindingFlags.Instance | BindingFlags.NonPublic).GetValue(instance);
        }
    }
}
