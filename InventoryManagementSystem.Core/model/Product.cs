using System.ComponentModel;

namespace FelixBerinde_InventoryManagementSystem
{
    public class Product
    {
        public BindingList<Part> AssociatedParts = new BindingList<Part>();
        public int ProductID { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public int InStock { get; set; }
        public int Min { get; set; }
        public int Max { get; set; }

        public void addAssociatedPart(Part part)
        {
            AssociatedParts.Add(part);
        }

        public bool removeAssociatedPart(int partID)
        {
            Part part = lookupAssociatedPart(partID);
            return part != null && AssociatedParts.Remove(part);
        }

        public Part lookupAssociatedPart(int partID)
        {
            foreach (var part in AssociatedParts)
            {
                if (part.PartID == partID)
                {
                    return part;
                }
            }
            return null;
        }
    }
}
