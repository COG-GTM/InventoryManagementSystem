using System;
using System.Collections.Generic;
using System.Drawing;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using FelixBerinde_InventoryManagementSystem;
using FelixBerinde_InventoryManagementSystem.model;
using Xunit;

namespace InventoryManagementSystem.UI.Tests
{
    [Collection("WinForms")]
    public class FormValidationTests
    {
        [WindowsFact]
        public void Editor_fields_highlight_empty_invalid_and_valid_input()
        {
            FormSmokeTests.RunSta(() =>
            {
                using var addPart = new AddPart();
                using var modPart = new ModPart();
                using var addProduct = new AddProduct();
                using var modProduct = new ModProduct();
                foreach (Form form in new Form[] { addPart, modPart, addProduct, modProduct })
                {
                    CheckField(form, "nameBox", "Part", " ");
                    foreach (string field in new[] { "inventoryBox", "maxBox", "minBox" })
                        CheckField(form, field, "10", "not a number", "2147483648");
                    CheckField(form, "priceCostBox", "10", "not a price");
                    Field<TextBox>(form, "nameBox").Text = string.Empty;
                    Assert.False(Field<Button>(form, "saveBtn").Enabled);
                }

                CheckPartSource(addPart, "inHouse", "radioButton1");
                CheckPartSource(modPart, "inHouseRadio", "outsourcedRadio");
            });
        }

        [WindowsFact]
        public void Editors_reject_reversed_limits_and_inventory_outside_limits()
        {
            FormSmokeTests.RunSta(() =>
            {
                using var addPart = new AddPart();
                using var modPart = new ModPart();
                using var addProduct = new AddProduct();
                using var modProduct = new ModProduct();
                foreach (Form form in new Form[] { addPart, modPart, addProduct, modProduct })
                {
                    Field<TextBox>(form, "minBox").Text = "20";
                    Field<TextBox>(form, "maxBox").Text = "10";
                    AssertDialog(form, "saveBtn_Click", "Minimum must be less than maximum.");
                    Field<TextBox>(form, "minBox").Text = "1";
                    foreach (string inventory in new[] { "0", "11" })
                    {
                        Field<TextBox>(form, "inventoryBox").Text = inventory;
                        AssertDialog(form, "saveBtn_Click", "Inventory must be between minimum and maximum.");
                    }
                }
            });
        }

        [WindowsFact]
        public void MainScreen_rejects_modify_and_delete_without_selection()
        {
            FormSmokeTests.RunSta(() =>
            {
                using var main = new MainScreen();
                Field<DataGridView>(main, "dgvParts").ClearSelection();
                Field<DataGridView>(main, "dgvProducts").ClearSelection();
                foreach (string handler in new[] { "partModifyBtn_Click", "productModifyBtn_Click", "partDeleteBtn_Click", "productDeleteBtn_Click" })
                    AssertDialog(main, handler, "Nothing Selected!");
            });
        }

        private static void CheckField(Form form, string name, string valid, params string[] invalid)
        {
            var field = Field<TextBox>(form, name);
            field.Text = valid;
            Assert.Equal(Color.White, field.BackColor);
            field.Text = string.Empty;
            Assert.Equal(Color.Salmon, field.BackColor);
            foreach (string value in invalid)
            {
                field.Text = value;
                Assert.Equal(Color.Salmon, field.BackColor);
            }
            field.Text = valid;
            Assert.Equal(Color.White, field.BackColor);
        }

        private static void CheckPartSource(Form form, string inhouse, string outsourced)
        {
            Field<RadioButton>(form, inhouse).Checked = true;
            CheckField(form, "machineIDBox", "42", "company", "2147483648");
            Field<RadioButton>(form, outsourced).Checked = true;
            Assert.Equal("Company Name", Field<Label>(form, "machineIDLabel").Text);
            Assert.Empty(Field<TextBox>(form, "machineIDBox").Text);
            CheckField(form, "machineIDBox", "Company", " ");
            Field<RadioButton>(form, inhouse).Checked = true;
            Assert.Equal("Machine ID", Field<Label>(form, "machineIDLabel").Text);
            Assert.Empty(Field<TextBox>(form, "machineIDBox").Text);
        }

        private static T Field<T>(Form form, string name) where T : Control
        {
            return (T)form.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic).GetValue(form);
        }

        private static void AssertDialog(Form form, string handler, string expected)
        {
            _ = form.Handle;
            var messages = new List<string>();
            var parts = new List<Part>(Inventory.AllParts);
            var products = new List<Product>(Inventory.Products);
            uint threadId = GetCurrentThreadId();
            using var done = new ManualResetEventSlim();
            var watcher = new Thread(() =>
            {
                for (int attempt = 0; attempt < 100 && !done.Wait(50); attempt++)
                {
                    EnumThreadWindows(threadId, (window, parameter) =>
                    {
                        var className = new StringBuilder(256);
                        GetClassName(window, className, className.Capacity);
                        if (IsWindowVisible(window) && className.ToString() == "#32770")
                        {
                            EnumChildWindows(window, (child, childParameter) =>
                            {
                                var text = new StringBuilder(1024);
                                GetWindowText(child, text, text.Capacity);
                                messages.Add(text.ToString());
                                return true;
                            }, IntPtr.Zero);
                            PostMessage(window, 0x0010, IntPtr.Zero, IntPtr.Zero);
                        }
                        return true;
                    }, IntPtr.Zero);
                }
            }) { IsBackground = true };
            watcher.Start();
            try
            {
                form.GetType().GetMethod(handler, BindingFlags.Instance | BindingFlags.NonPublic)
                    .Invoke(form, new object[] { form, EventArgs.Empty });
            }
            finally
            {
                done.Set();
                watcher.Join();
            }
            Assert.Contains(expected, messages);
            Assert.False(form.IsDisposed);
            Assert.Equal(parts, Inventory.AllParts);
            Assert.Equal(products, Inventory.Products);
        }

        private delegate bool WindowCallback(IntPtr window, IntPtr parameter);
        [DllImport("kernel32.dll")]
        private static extern uint GetCurrentThreadId();
        [DllImport("user32.dll")]
        private static extern bool EnumThreadWindows(uint thread, WindowCallback callback, IntPtr parameter);
        [DllImport("user32.dll")]
        private static extern bool EnumChildWindows(IntPtr parent, WindowCallback callback, IntPtr parameter);
        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr window);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int GetClassName(IntPtr window, StringBuilder text, int count);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int GetWindowText(IntPtr window, StringBuilder text, int count);
        [DllImport("user32.dll")]
        private static extern bool PostMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
    }
}
