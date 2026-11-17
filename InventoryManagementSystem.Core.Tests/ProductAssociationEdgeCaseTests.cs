using FelixBerinde_InventoryManagementSystem;
using FelixBerinde_InventoryManagementSystem.model;
using Xunit;

namespace InventoryManagementSystem.Core.Tests
{
    public class ProductAssociationEdgeCaseTests
    {
        [Fact]
        public void Adding_inhouse_and_outsourced_associations_preserves_order_and_identity()
        {
            var product = new Product { ProductID = 1 };
            var first = new Inhouse { PartID = 10, MachineID = 101 };
            var second = new Outsourced { PartID = 42, CompanyName = "Supplier" };

            product.addAssociatedPart(first);
            product.addAssociatedPart(second);

            Assert.Collection(product.AssociatedParts,
                part => Assert.Same(first, part),
                part => Assert.Same(second, part));
            Assert.Same(first, product.lookupAssociatedPart(10));
            Assert.Same(second, product.lookupAssociatedPart(42));
        }

        [Fact]
        public void Removing_second_of_two_associations_keeps_first_and_other_product_unchanged()
        {
            var product = new Product { ProductID = 1 };
            var otherProduct = new Product { ProductID = 2 };
            var first = new Inhouse { PartID = 10 };
            var second = new Outsourced { PartID = 42, CompanyName = "Supplier" };
            product.addAssociatedPart(first);
            product.addAssociatedPart(second);
            otherProduct.addAssociatedPart(second);

            Assert.True(product.removeAssociatedPart(42));

            Assert.Same(first, Assert.Single(product.AssociatedParts));
            Assert.Same(first, product.lookupAssociatedPart(10));
            Assert.Null(product.lookupAssociatedPart(42));
            Assert.Same(second, Assert.Single(otherProduct.AssociatedParts));
            Assert.Equal("Supplier", second.CompanyName);
            Assert.False(product.removeAssociatedPart(42));
        }

        [Theory]
        [InlineData(int.MinValue)]
        [InlineData(-1)]
        [InlineData(0)]
        [InlineData(404)]
        [InlineData(int.MaxValue)]
        public void Missing_association_lookup_and_removal_leave_existing_associations_unchanged(int missingId)
        {
            var product = new Product { ProductID = 1 };
            var first = new Inhouse { PartID = 10 };
            var second = new Outsourced { PartID = 42 };
            product.addAssociatedPart(first);
            product.addAssociatedPart(second);

            Assert.Null(product.lookupAssociatedPart(missingId));
            Assert.False(product.removeAssociatedPart(missingId));

            Assert.Collection(product.AssociatedParts,
                part => Assert.Same(first, part),
                part => Assert.Same(second, part));
        }

        [Fact]
        public void Empty_associations_allow_missing_lookup_removal_and_readding_after_last_removal()
        {
            var product = new Product { ProductID = 1 };
            Assert.Empty(product.AssociatedParts);
            Assert.Null(product.lookupAssociatedPart(42));
            Assert.False(product.removeAssociatedPart(42));

            var part = new Inhouse { PartID = 42 };
            product.addAssociatedPart(part);
            Assert.True(product.removeAssociatedPart(42));
            Assert.Empty(product.AssociatedParts);
            Assert.Null(product.lookupAssociatedPart(42));
            Assert.False(product.removeAssociatedPart(42));

            product.addAssociatedPart(part);
            Assert.Same(part, Assert.Single(product.AssociatedParts));
            Assert.Same(part, product.lookupAssociatedPart(42));
        }

        [Fact]
        public void Duplicate_association_ids_are_looked_up_and_removed_one_at_a_time()
        {
            var product = new Product { ProductID = 1 };
            var first = new Inhouse { PartID = 42, Name = "First" };
            var second = new Outsourced { PartID = 42, Name = "Second" };
            product.addAssociatedPart(first);
            product.addAssociatedPart(second);

            Assert.Same(first, product.lookupAssociatedPart(42));
            Assert.True(product.removeAssociatedPart(42));
            Assert.Same(second, Assert.Single(product.AssociatedParts));
            Assert.Same(second, product.lookupAssociatedPart(42));
            Assert.True(product.removeAssociatedPart(42));
            Assert.Empty(product.AssociatedParts);
            Assert.False(product.removeAssociatedPart(42));
        }
    }
}
