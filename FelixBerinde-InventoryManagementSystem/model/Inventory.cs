using System;
using System.ComponentModel;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FelixBerinde_InventoryManagementSystem.model
{
    class Inventory
    {
        //create default constructor
        static Inventory() { }

        public static BindingList<Part> AllParts = new BindingList<Part>();
        public static BindingList<Product> Products = new BindingList<Product>();


        //create test data
        public static bool ranFakeData = false;
        public static void fakeData()
        {
            //check to see if data was already added to lists
            if (ranFakeData == false)
            {
                //create parts for testing
                Part carWheel = new Outsourced
                {
                    PartID = 1,
                    Name = "Light",
                    InStock = 12,
                    Min = 4,
                    Max = 20,
                    Price = 25.25m,
                    CompanyName = "New Paths Inc."
                };
                Part engine = new Outsourced
                {
                    PartID = 2,
                    Name = "Engine",
                    InStock = 5,
                    Min = 1,
                    Max = 10,
                    Price = 500m,
                    CompanyName = "Ford Motor Co."
                };

                Part software = new Inhouse
                {
                    PartID = 3,
                    Name = "Software",
                    InStock = 7,
                    Min = 1,
                    Max = 100,
                    Price = 300m,
                    MachineID = 10101
                };

                //create products for testing

                Product boat = new Product
                {
                    ProductID = 2,
                    Name = "Boat",
                    InStock = 1,
                    Min = 1,
                    Max = 1,
                    Price = 15000m
                };

                Product motorcycle = new Product
                {
                    ProductID = 1,
                    Name = "Motorcycle",
                    InStock = 3,
                    Min = 1,
                    Max = 10,
                    Price = 240000m
                };
                Product plane = new Product
                {
                    ProductID = 3,
                    Name = "Plane",
                    InStock = 2,
                    Min = 1,
                    Max = 2,
                    Price = 1090000m
                };

                AllParts.Add(carWheel);
                AllParts.Add(engine);
                AllParts.Add(software);
                Products.Add(motorcycle);
                Products.Add(boat);
                Products.Add(plane);
                ranFakeData = true;
            }
        }
        
        //methods for parts

        public static void addPart(Part part)
        {
            AllParts.Add(part);
        }
        
        public static bool deletePart(Part part)
        {
            AllParts.Remove(part);
            return true;
        }

        public static Part lookupPart(int partID)
        {
            foreach (var part in AllParts)
            {
                if (partID == part.PartID)
                {
                    return part;
                }
            }
            return null;
        }

        public static void updatePart(int partID, Part part)
        {
            for (int i = 0; i < AllParts.Count; i++)
            {
                if (partID == AllParts[i].PartID)
                {
                    AllParts[i] = part;
                }
            }
        }

        public static int nextPartID()
        {
            return AllParts.Count == 0 ? 1 : AllParts.Max(existingPart => existingPart.PartID) + 1;
        }

        public static Part duplicatePart(Part part)
        {
            int partID = nextPartID();
            Part copy;
            if (part is Inhouse ih)
            {
                copy = new Inhouse { PartID = partID, MachineID = ih.MachineID };
            }
            else if (part is Outsourced os)
            {
                copy = new Outsourced { PartID = partID, CompanyName = os.CompanyName };
            }
            else
            {
                throw new ArgumentException("Unsupported part type.", nameof(part));
            }

            copy.Name = part.Name + " (copy)";
            copy.Price = part.Price;
            copy.InStock = part.InStock;
            copy.Min = part.Min;
            copy.Max = part.Max;
            AllParts.Add(copy);
            return copy;
        }

        //methods for products

        public static void addProduct(Product product)
        {
            Products.Add(product);
        }

        public static bool removeProduct(int productID)
        {
            foreach (var product in Products)
            {
                if (product.ProductID == productID)
                {
                    Products.Remove(product);
                }
            }
            return true;
        }

        public static Product lookupProduct(int productID)
        {
            foreach (var product in Products)
            {
                if(product.ProductID == productID)
                {
                    return product;
                }
            }
            return null;
        }

        public static void updateProduct(int productID, Product product)
        {
            for (int i = 0; i < Products.Count; i++)
            {
                if(productID == Products[i].ProductID)
                {
                    Products[i] = product;
                }
            }
        }

        public static int nextProductID()
        {
            return Products.Count == 0 ? 1 : Products.Max(existingProduct => existingProduct.ProductID) + 1;
        }

        public static Product duplicateProduct(Product product)
        {
            int productID = nextProductID();
            Product copy = new Product
            {
                ProductID = productID,
                Name = product.Name + " (copy)",
                Price = product.Price,
                InStock = product.InStock,
                Min = product.Min,
                Max = product.Max
            };

            foreach (Part part in product.AssociatedParts)
            {
                copy.addAssociatedPart(part);
            }

            Products.Add(copy);
            return copy;
        }
    }
}
