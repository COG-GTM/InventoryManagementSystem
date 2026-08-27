using FelixBerinde_InventoryManagementSystem;
using FelixBerinde_InventoryManagementSystem.model;
using Xunit;

namespace InventoryManagementSystem.Core.Tests
{
    public class InventoryTests
    {
        public InventoryTests()
        {
            Inventory.AllParts.Clear();
            Inventory.Products.Clear();
            Inventory.ranFakeData = false;
        }

        [Fact]
        public void Parts_support_add_lookup_update_and_delete()
        {
            var original = new Inhouse { PartID = 1, Name = "Motor", Price = 12.34m };
            Inventory.addPart(original);
            Assert.Same(original, Inventory.lookupPart(1));

            var replacement = new Outsourced { PartID = 1, Name = "Updated", Price = 56.78m };
            Inventory.updatePart(1, replacement);
            Assert.Same(replacement, Inventory.lookupPart(1));
            Inventory.deletePart(replacement);
            Assert.Empty(Inventory.AllParts);
        }

        [Fact]
        public void Products_support_add_lookup_update_and_delete()
        {
            var original = new Product { ProductID = 1, Name = "Starter", Price = 10m };
            Inventory.addProduct(original);
            Assert.Same(original, Inventory.lookupProduct(1));

            var replacement = new Product { ProductID = 1, Name = "Updated", Price = 20m };
            Inventory.updateProduct(1, replacement);
            Assert.Same(replacement, Inventory.lookupProduct(1));
            Assert.True(Inventory.removeProduct(1));
            Assert.False(Inventory.removeProduct(1));
        }

        [Fact]
        public void Missing_lookups_return_null_and_missing_deletes_are_noops()
        {
            Assert.Null(Inventory.lookupPart(404));
            Assert.Null(Inventory.lookupProduct(404));
            Inventory.deletePart(new Inhouse { PartID = 404 });
            Assert.Empty(Inventory.AllParts);
            Assert.Empty(Inventory.Products);
        }

        [Fact]
        public void Removing_a_product_from_a_multi_product_inventory_succeeds()
        {
            Inventory.addProduct(new Product { ProductID = 1, Name = "First" });
            Inventory.addProduct(new Product { ProductID = 2, Name = "Second" });
            Inventory.addProduct(new Product { ProductID = 3, Name = "Third" });

            Assert.True(Inventory.removeProduct(2));
            Assert.Null(Inventory.lookupProduct(2));
            Assert.Equal(2, Inventory.Products.Count);
            Assert.NotNull(Inventory.lookupProduct(3));
        }

        [Fact]
        public void Product_associations_can_add_lookup_and_remove_non_first_part()
        {
            var product = new Product { ProductID = 1 };
            var first = new Inhouse { PartID = 1 };
            var second = new Outsourced { PartID = 2 };
            product.addAssociatedPart(first);
            product.addAssociatedPart(second);

            Assert.Same(second, product.lookupAssociatedPart(2));
            Assert.True(product.removeAssociatedPart(2));
            Assert.Null(product.lookupAssociatedPart(2));
            Assert.Same(first, product.lookupAssociatedPart(1));
            Assert.False(product.removeAssociatedPart(404));
        }

        [Fact]
        public void Core_model_preserves_values_without_form_validation()
        {
            var part = new Inhouse { PartID = 1, Min = 10, Max = 2, InStock = 99 };
            var product = new Product { ProductID = 1, Min = 10, Max = 2, InStock = -1 };
            Inventory.addPart(part);
            Inventory.addProduct(product);

            Assert.Equal(10, Inventory.lookupPart(1).Min);
            Assert.Equal(2, Inventory.lookupPart(1).Max);
            Assert.Equal(99, Inventory.lookupPart(1).InStock);
            Assert.Equal(-1, Inventory.lookupProduct(1).InStock);
        }

        [Fact]
        public void Empty_and_duplicate_ids_are_retained_as_model_values()
        {
            var emptyPartId = new Inhouse { PartID = 0, Name = "Empty ID" };
            var firstDuplicate = new Inhouse { PartID = 7, Name = "First" };
            var secondDuplicate = new Inhouse { PartID = 7, Name = "Second" };
            Inventory.addPart(emptyPartId);
            Inventory.addPart(firstDuplicate);
            Inventory.addPart(secondDuplicate);

            Assert.Same(emptyPartId, Inventory.lookupPart(0));
            Assert.Same(firstDuplicate, Inventory.lookupPart(7));
            Assert.Equal(3, Inventory.AllParts.Count);
        }

        [Fact]
        public void Decimal_prices_retain_precision()
        {
            var part = new Outsourced { PartID = 1, Price = 1234.5678m };
            Inventory.addPart(part);
            Assert.Equal(1234.5678m, Inventory.lookupPart(1).Price);
        }
    }
}
