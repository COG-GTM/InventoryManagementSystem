using System.Collections.Generic;
using FelixBerinde_InventoryManagementSystem;
using FelixBerinde_InventoryManagementSystem.model;
using Xunit;

namespace InventoryManagementSystem.Core.Tests
{
    public class StockBoundaryTests
    {
        public StockBoundaryTests()
        {
            Inventory.AllParts.Clear();
            Inventory.Products.Clear();
            Inventory.ranFakeData = false;
        }

        public static IEnumerable<object[]> StockCases()
        {
            yield return new object[] { 0, 0, 0 };
            yield return new object[] { 0, 10, 0 };
            yield return new object[] { 0, 10, 10 };
            yield return new object[] { 10, 10, 10 };
            yield return new object[] { 0, 10, -1 };
            yield return new object[] { 0, 10, 11 };
            yield return new object[] { 10, 2, 99 };
            yield return new object[] { -10, 0, -10 };
            yield return new object[] { int.MinValue, int.MaxValue, int.MinValue };
            yield return new object[] { int.MinValue, int.MaxValue, int.MaxValue };
        }

        [Theory]
        [MemberData(nameof(StockCases))]
        public void Inhouse_part_retains_stock_boundaries_on_add_and_update(int min, int max, int stock)
        {
            AssertPartStockRoundTrip(
                new Inhouse { PartID = 42, Min = min, Max = max, InStock = stock },
                new Inhouse { PartID = 42, Min = min, Max = max, InStock = stock },
                min, max, stock);
        }

        [Theory]
        [MemberData(nameof(StockCases))]
        public void Outsourced_part_retains_stock_boundaries_on_add_and_update(int min, int max, int stock)
        {
            AssertPartStockRoundTrip(
                new Outsourced { PartID = 42, Min = min, Max = max, InStock = stock },
                new Outsourced { PartID = 42, Min = min, Max = max, InStock = stock },
                min, max, stock);
        }

        [Theory]
        [MemberData(nameof(StockCases))]
        public void Product_retains_stock_boundaries_on_add_and_update(int min, int max, int stock)
        {
            // Range validation belongs to the forms; the model stores even invalid ranges.
            var original = new Product { ProductID = 42, Min = min, Max = max, InStock = stock };
            Inventory.addProduct(original);
            var added = Inventory.lookupProduct(42);
            Assert.Same(original, added);
            Assert.Equal(min, added.Min);
            Assert.Equal(max, added.Max);
            Assert.Equal(stock, added.InStock);

            var replacement = new Product { ProductID = 42, Min = min, Max = max, InStock = stock };
            Inventory.updateProduct(42, replacement);
            var updated = Inventory.lookupProduct(42);
            Assert.Same(replacement, updated);
            Assert.Same(replacement, Assert.Single(Inventory.Products));
            Assert.Equal(min, updated.Min);
            Assert.Equal(max, updated.Max);
            Assert.Equal(stock, updated.InStock);
        }

        private static void AssertPartStockRoundTrip(Part original, Part replacement, int min, int max, int stock)
        {
            // Characterize storage without introducing the forms' validation into the model.
            Inventory.addPart(original);
            var added = Inventory.lookupPart(42);
            Assert.Same(original, added);
            Assert.Equal(min, added.Min);
            Assert.Equal(max, added.Max);
            Assert.Equal(stock, added.InStock);

            Inventory.updatePart(42, replacement);
            var updated = Inventory.lookupPart(42);
            Assert.Same(replacement, updated);
            Assert.Same(replacement, Assert.Single(Inventory.AllParts));
            Assert.Equal(min, updated.Min);
            Assert.Equal(max, updated.Max);
            Assert.Equal(stock, updated.InStock);
        }
    }
}
