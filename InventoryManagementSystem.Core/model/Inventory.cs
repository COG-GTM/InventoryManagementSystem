using System.ComponentModel;

namespace FelixBerinde_InventoryManagementSystem.model
{
    public static class Inventory
    {
        public static BindingList<Part> AllParts = new BindingList<Part>();
        public static BindingList<Product> Products = new BindingList<Product>();
        public static bool ranFakeData = false;

        public static void fakeData()
        {
            if (ranFakeData == false)
            {
                AllParts.Add(new Outsourced
                {
                    PartID = 1,
                    Name = "Light",
                    InStock = 12,
                    Min = 4,
                    Max = 20,
                    Price = 25.25m,
                    CompanyName = "New Paths Inc."
                });
                AllParts.Add(new Outsourced
                {
                    PartID = 2,
                    Name = "Engine",
                    InStock = 5,
                    Min = 1,
                    Max = 10,
                    Price = 500m,
                    CompanyName = "Ford Motor Co."
                });
                AllParts.Add(new Inhouse
                {
                    PartID = 3,
                    Name = "Software",
                    InStock = 7,
                    Min = 1,
                    Max = 100,
                    Price = 300m,
                    MachineID = 10101
                });
                Products.Add(new Product
                {
                    ProductID = 2,
                    Name = "Boat",
                    InStock = 1,
                    Min = 1,
                    Max = 1,
                    Price = 15000m
                });
                Products.Add(new Product
                {
                    ProductID = 1,
                    Name = "Motorcycle",
                    InStock = 3,
                    Min = 1,
                    Max = 10,
                    Price = 240000m
                });
                Products.Add(new Product
                {
                    ProductID = 3,
                    Name = "Plane",
                    InStock = 2,
                    Min = 1,
                    Max = 2,
                    Price = 1090000m
                });
                ranFakeData = true;
            }
        }

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
                if (product.ProductID == productID)
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
                if (productID == Products[i].ProductID)
                {
                    Products[i] = product;
                }
            }
        }
    }
}
