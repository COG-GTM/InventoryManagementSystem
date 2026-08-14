using FelixBerinde_InventoryManagementSystem.model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace FelixBerinde_InventoryManagementSystem
{
    public partial class AddPart : Form
    {
        private readonly ToolTip validationToolTip = new ToolTip { ShowAlways = true };

        private void save()
        {
            if (nameBox.Text == "" || inventoryBox.Text.ToString() == "" || priceCostBox.Text.ToString() == "" || maxBox.Text.ToString() == "" || minBox.Text.ToString() == "" || machineIDBox.Text.ToString() == "")
            {
                saveBtn.Enabled = false;
            }
            else
            {
                saveBtn.Enabled = true;
            }
        }

        public AddPart()
        {
            InitializeComponent();
            save();
        }


        private void cancelBtn_Click(object sender, EventArgs e)
        {
            this.Hide();
            MainScreen mainScreen = new MainScreen();
            mainScreen.ShowDialog();
            this.Close();
        }

        private void saveBtn_Click(object sender, EventArgs e)
        {

            if (int.Parse(minBox.Text) > int.Parse(maxBox.Text))
            {
                minBox.BackColor = System.Drawing.Color.Salmon;
                maxBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(minBox, "Minimum must be less than maximum.");
                validationToolTip.SetToolTip(maxBox, "Minimum must be less than maximum.");
                MessageBox.Show("Minimum must be less than maximum.");
                return;
            }

            minBox.BackColor = System.Drawing.Color.White;
            maxBox.BackColor = System.Drawing.Color.White;
            validationToolTip.SetToolTip(minBox, string.Empty);
            validationToolTip.SetToolTip(maxBox, string.Empty);

            if (int.Parse(inventoryBox.Text) > int.Parse(maxBox.Text) || int.Parse(inventoryBox.Text) < int.Parse(minBox.Text))
            {
                inventoryBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(inventoryBox, "Inventory must be between minimum and maximum.");
                MessageBox.Show("Inventory must be between minimum and maximum.");
                return;
            }

            inventoryBox.BackColor = System.Drawing.Color.White;
            validationToolTip.SetToolTip(inventoryBox, string.Empty);


            int num = Inventory.AllParts.Count + 1;

            var name = nameBox.Text;

            var inventory = int.Parse(inventoryBox.Text);

            var price = decimal.Parse(priceCostBox.Text);

            var max = int.Parse(maxBox.Text);

            var min = int.Parse(minBox.Text);



            if (inHouse.Checked)
            {
                var machineID = int.Parse(machineIDBox.Text);

                var tempInHousePart = new Inhouse
                {
                    PartID = num,
                    Name = name,
                    InStock = inventory,
                    MachineID = machineID,
                    Max = max,
                    Min = min,
                    Price = price
                };

                Inventory.addPart(tempInHousePart);
                ++(num);
            }
            else
            {
                var tempOutSourcedPart = new Outsourced
                {
                    PartID = num,
                    Name = name,
                    InStock = inventory,
                    CompanyName = machineIDBox.Text,
                    Max = max,
                    Min = min,
                    Price = price
                };

                Inventory.addPart(tempOutSourcedPart);
                ++(num);
            }

            this.Hide();
            MainScreen mainScreen = new MainScreen();
            mainScreen.ShowDialog();
            this.Close();
        }

        private void inHouse_CheckedChanged(object sender, EventArgs e)
        {
            if (sender is RadioButton)
            {
                RadioButton radioButton = (RadioButton)sender;
                if (radioButton.Checked)
                {
                    machineIDLabel.Text = "Machine ID";
                    machineIDBox.Clear();
                }
            }
        }

        private void radioButton1_CheckedChanged(object sender, EventArgs e)
        {
            if (sender is RadioButton)
            {
                RadioButton radioButton = (RadioButton)sender;
                if (radioButton.Checked)
                {
                    machineIDLabel.Text = "Company Name";
                    machineIDBox.Clear();
                }
            }
        }

        private void AddPart_Load(object sender, EventArgs e)
        {
        }

        private void nameBox_TextChanged(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(nameBox.Text))
            {
                nameBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(nameBox, "Please enter a Part name.");
                save();
            }
            else
            {
                nameBox.BackColor = System.Drawing.Color.White;
                validationToolTip.SetToolTip(nameBox, string.Empty);
                save();
            }
        }

        private void inventoryBox_TextChanged(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(inventoryBox.Text) || int.TryParse(inventoryBox.Text, out _) == false)
            {
                inventoryBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(inventoryBox, "Please enter a number.");
                save();
            }
            else
            {
                inventoryBox.BackColor = System.Drawing.Color.White;
                validationToolTip.SetToolTip(inventoryBox, string.Empty);
                save();
            }
        }

        private void priceCostBox_TextChanged(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(priceCostBox.Text) || decimal.TryParse(priceCostBox.Text, out _) == false)
            {
                priceCostBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(priceCostBox, "Please enter a number.");
                save();
            }
            else
            {
                priceCostBox.BackColor = System.Drawing.Color.White;
                validationToolTip.SetToolTip(priceCostBox, string.Empty);
                save();
            }
        }

        private void maxBox_TextChanged(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(maxBox.Text) || int.TryParse(maxBox.Text, out _) == false)
            {
                maxBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(maxBox, "Please enter a number.");
                save();
            }
            else
            {
                maxBox.BackColor = System.Drawing.Color.White;
                validationToolTip.SetToolTip(maxBox, string.Empty);
                save();
            }
        }

        private void minBox_TextChanged(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(minBox.Text) || int.TryParse(minBox.Text, out _) == false)
            {
                minBox.BackColor = System.Drawing.Color.Salmon;
                validationToolTip.SetToolTip(minBox, "Please enter a number.");
                save();
            }
            else
            {
                minBox.BackColor = System.Drawing.Color.White;
                validationToolTip.SetToolTip(minBox, string.Empty);
                save();
            }
        }

        private void machineIDBox_TextChanged(object sender, EventArgs e)
        {
            if (inHouse.Checked)
            {
                if (string.IsNullOrWhiteSpace(machineIDBox.Text) || int.TryParse(machineIDBox.Text, out _) == false)
                {
                    machineIDBox.BackColor = System.Drawing.Color.Salmon;
                    validationToolTip.SetToolTip(machineIDBox, "Please enter a number.");
                    saveBtn.Enabled = false;
                }
                else
                {
                    machineIDBox.BackColor = System.Drawing.Color.White;
                    validationToolTip.SetToolTip(machineIDBox, string.Empty);
                    saveBtn.Enabled = true;
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(machineIDBox.Text))
                {
                    machineIDBox.BackColor = System.Drawing.Color.Salmon;
                    validationToolTip.SetToolTip(machineIDBox, "Please enter a company name.");
                    saveBtn.Enabled = false;
                }
                else
                {
                    machineIDBox.BackColor = System.Drawing.Color.White;
                    validationToolTip.SetToolTip(machineIDBox, string.Empty);
                    saveBtn.Enabled = true;
                }
            }
        }
    }
}
