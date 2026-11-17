using FelixBerinde_InventoryManagementSystem;
using FelixBerinde_InventoryManagementSystem.model;
using Xunit;

namespace InventoryManagementSystem.Core.Tests
{
    public class InventoryEdgeCaseTests
    {
        public InventoryEdgeCaseTests()
        {
            Inventory.AllParts.Clear();
            Inventory.Products.Clear();
            Inventory.ranFakeData = false;
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public void Part_crud_preserves_fields_and_unrelated_parts(bool outsourced)
        {
            var first = new Inhouse { PartID = 10, Name = "First" };
            Part original = outsourced
                ? new Outsourced { CompanyName = "Original supplier" }
                : new Inhouse { MachineID = 101 };
            original.PartID = 42;
            original.Name = "Original part";
            original.Price = 123.4567m;
            original.InStock = 5;
            original.Min = 1;
            original.Max = 10;
            Inventory.addPart(first);
            Inventory.addPart(original);

            Assert.Same(original, Inventory.lookupPart(42));
            Assert.Equal("Original part", original.Name);
            Assert.Equal(123.4567m, original.Price);
            Assert.Equal(5, original.InStock);
            Assert.Equal(1, original.Min);
            Assert.Equal(10, original.Max);

            Part replacement = outsourced
                ? new Outsourced { CompanyName = "New supplier" }
                : new Inhouse { MachineID = 202 };
            replacement.PartID = 42;
            replacement.Name = "Replacement part";
            replacement.Price = 987.6543m;
            replacement.InStock = 7;
            replacement.Min = 2;
            replacement.Max = 20;
            Inventory.updatePart(42, replacement);

            Assert.Collection(Inventory.AllParts,
                part => Assert.Same(first, part),
                part => Assert.Same(replacement, part));
            var found = Inventory.lookupPart(42);
            Assert.Equal("Replacement part", found.Name);
            Assert.Equal(987.6543m, found.Price);
            Assert.Equal(7, found.InStock);
            Assert.Equal(2, found.Min);
            Assert.Equal(20, found.Max);
            if (outsourced)
                Assert.Equal("New supplier", Assert.IsType<Outsourced>(found).CompanyName);
            else
                Assert.Equal(202, Assert.IsType<Inhouse>(found).MachineID);

            Assert.True(Inventory.deletePart(replacement));
            Assert.Null(Inventory.lookupPart(42));
            Assert.Same(first, Assert.Single(Inventory.AllParts));
            Assert.True(Inventory.deletePart(first));
            Assert.Empty(Inventory.AllParts);
        }

        [Theory]
        [InlineData(false)]
        [InlineData(true)]
        public void Updating_part_can_swap_inhouse_and_outsourced_in_both_directions(bool startsOutsourced)
        {
            Part original = startsOutsourced
                ? new Outsourced { PartID = 42, CompanyName = "Supplier" }
                : new Inhouse { PartID = 42, MachineID = 101 };
            Part replacement = startsOutsourced
                ? new Inhouse { PartID = 42, MachineID = 202 }
                : new Outsourced { PartID = 42, CompanyName = "New supplier" };
            var first = new Inhouse { PartID = 10 };
            var last = new Outsourced { PartID = 99 };
            Inventory.addPart(first);
            Inventory.addPart(original);
            Inventory.addPart(last);

            Inventory.updatePart(42, replacement);

            Assert.Same(replacement, Inventory.lookupPart(42));
            Assert.Collection(Inventory.AllParts,
                part => Assert.Same(first, part),
                part => Assert.Same(replacement, part),
                part => Assert.Same(last, part));
            if (startsOutsourced)
                Assert.Equal(202, Assert.IsType<Inhouse>(Inventory.lookupPart(42)).MachineID);
            else
                Assert.Equal("New supplier", Assert.IsType<Outsourced>(Inventory.lookupPart(42)).CompanyName);
        }

        [Fact]
        public void Product_crud_replaces_fields_and_associations_without_changing_other_products()
        {
            var first = new Product { ProductID = 10, Name = "First" };
            var original = new Product
            {
                ProductID = 42, Name = "Original product", Price = 123.4567m,
                InStock = 5, Min = 1, Max = 10
            };
            original.addAssociatedPart(new Inhouse { PartID = 1 });
            Inventory.addProduct(first);
            Inventory.addProduct(original);
            Assert.Same(original, Inventory.lookupProduct(42));

            var replacement = new Product
            {
                ProductID = 42, Name = "Replacement product", Price = 987.6543m,
                InStock = 7, Min = 2, Max = 20
            };
            var associated = new Outsourced { PartID = 2, CompanyName = "Supplier" };
            replacement.addAssociatedPart(associated);
            Inventory.updateProduct(42, replacement);

            Assert.Collection(Inventory.Products,
                product => Assert.Same(first, product),
                product => Assert.Same(replacement, product));
            var found = Inventory.lookupProduct(42);
            Assert.Equal("Replacement product", found.Name);
            Assert.Equal(987.6543m, found.Price);
            Assert.Equal(7, found.InStock);
            Assert.Equal(2, found.Min);
            Assert.Equal(20, found.Max);
            Assert.Same(associated, Assert.Single(found.AssociatedParts));
            Assert.Null(found.lookupAssociatedPart(1));

            Assert.True(found.removeAssociatedPart(2));
            Assert.True(Inventory.removeProduct(42));
            Assert.Null(Inventory.lookupProduct(42));
            Assert.Same(first, Assert.Single(Inventory.Products));
            Assert.False(Inventory.removeProduct(42));
            Assert.True(Inventory.removeProduct(10));
            Assert.Empty(Inventory.Products);
        }

        [Theory]
        [InlineData(int.MinValue)]
        [InlineData(-1)]
        [InlineData(0)]
        [InlineData(404)]
        [InlineData(int.MaxValue)]
        public void Missing_ids_do_not_find_update_or_remove_existing_inventory(int missingId)
        {
            var part = new Inhouse { PartID = 42, Name = "Unchanged part" };
            var product = new Product { ProductID = 42, Name = "Unchanged product" };
            Inventory.addPart(part);
            Inventory.addProduct(product);

            Assert.Null(Inventory.lookupPart(missingId));
            Assert.Null(Inventory.lookupProduct(missingId));
            Inventory.updatePart(missingId, new Outsourced { PartID = missingId });
            Inventory.updateProduct(missingId, new Product { ProductID = missingId });
            Assert.False(Inventory.removeProduct(missingId));

            // Legacy deletePart reports success even when no instance was removed.
            Assert.True(Inventory.deletePart(new Inhouse { PartID = missingId }));
            Assert.Same(part, Assert.Single(Inventory.AllParts));
            Assert.Same(product, Assert.Single(Inventory.Products));
            Assert.Equal("Unchanged part", part.Name);
            Assert.Equal("Unchanged product", product.Name);
        }

        [Fact]
        public void Empty_inventory_lookups_updates_and_deletes_leave_both_lists_empty()
        {
            Assert.Null(Inventory.lookupPart(1));
            Assert.Null(Inventory.lookupProduct(1));
            Inventory.updatePart(1, new Inhouse { PartID = 1 });
            Inventory.updateProduct(1, new Product { ProductID = 1 });
            Assert.False(Inventory.removeProduct(1));
            // Keep the existing unconditional success result; do not fix it here.
            Assert.True(Inventory.deletePart(new Inhouse { PartID = 1 }));
            Assert.Empty(Inventory.AllParts);
            Assert.Empty(Inventory.Products);
            Assert.False(Inventory.ranFakeData);
        }

        [Fact]
        public void Deleting_a_different_part_instance_with_the_same_id_does_not_remove_the_stored_part()
        {
            var stored = new Inhouse { PartID = 42 };
            Inventory.addPart(stored);

            // Deletion uses object identity, but its legacy return value is always true.
            Assert.True(Inventory.deletePart(new Inhouse { PartID = 42 }));

            Assert.Same(stored, Assert.Single(Inventory.AllParts));
            Assert.Same(stored, Inventory.lookupPart(42));
        }
    }
}
