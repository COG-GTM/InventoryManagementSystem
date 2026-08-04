import { test, expect, type Locator, type Page } from '@playwright/test';

const partsPanel = (page: Page) => page.locator('.panel').filter({ has: page.locator('h2', { hasText: 'Parts' }) });
const productsPanel = (page: Page) => page.locator('.panel').filter({ has: page.locator('h2', { hasText: 'Products' }) });
const modal = (page: Page) => page.locator('.modal-backdrop .modal');

const unique = (base: string) => `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

async function fillField(modalRoot: Locator, label: string, value: string) {
  const field = modalRoot.locator('.field').filter({ hasText: label });
  await field.locator('input').first().fill(value);
}

async function selectKind(modalRoot: Locator, label: 'In-House' | 'Outsourced') {
  const radio = modalRoot.locator('.radios label').filter({ hasText: label }).locator('input[type="radio"]');
  await radio.check();
}

async function addPart(page: Page, data: {
  name: string;
  inStock: string;
  price: string;
  min: string;
  max: string;
  kind: 'In-House' | 'Outsourced';
  variable: string;
}) {
  const panel = partsPanel(page);
  await panel.getByRole('button', { name: 'Add' }).click();
  const m = modal(page);
  if (data.kind === 'Outsourced') await selectKind(m, 'Outsourced');
  await fillField(m, 'Name', data.name);
  await fillField(m, 'Inventory (In Stock)', data.inStock);
  await fillField(m, 'Price / Cost', data.price);
  await fillField(m, 'Min', data.min);
  await fillField(m, 'Max', data.max);
  const variableLabel = data.kind === 'In-House' ? 'Machine ID' : 'Company Name';
  await fillField(m, variableLabel, data.variable);
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
}

async function addProduct(page: Page, data: {
  name: string;
  inStock: string;
  price: string;
  min: string;
  max: string;
}) {
  const panel = productsPanel(page);
  await panel.getByRole('button', { name: 'Add' }).click();
  const m = modal(page);
  await fillField(m, 'Name', data.name);
  await fillField(m, 'Inventory (In Stock)', data.inStock);
  await fillField(m, 'Price', data.price);
  await fillField(m, 'Min', data.min);
  await fillField(m, 'Max', data.max);
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('happy path: parts and products lifecycle', async ({ page }) => {
  const parts = partsPanel(page);
  const products = productsPanel(page);
  const suffix = unique('');
  const partName = `Widget${suffix}`;
  const productName = `Bike${suffix}`;

  // Add a part
  await addPart(page, {
    name: partName,
    inStock: '5',
    price: '12.50',
    min: '1',
    max: '10',
    kind: 'Outsourced',
    variable: 'Acme',
  });
  const partRow = parts.locator('tbody tr').filter({ hasText: partName });
  await expect(partRow).toContainText('Outsourced');
  await expect(partRow).toContainText('Acme');

  // Modify the part
  await partRow.click();
  await parts.getByRole('button', { name: 'Modify' }).click();
  let m = modal(page);
  await expect(m.locator('h2')).toHaveText('Modify Part');
  await fillField(m, 'Price / Cost', '15.00');
  await fillField(m, 'Company Name', 'Acme Corp');
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
  await expect(partRow).toContainText('Acme Corp');
  await expect(partRow).toContainText('$15.00');

  // Add a product
  await addProduct(page, {
    name: productName,
    inStock: '2',
    price: '100',
    min: '1',
    max: '5',
  });
  const productRow = products.locator('tbody tr').filter({ hasText: productName });
  await expect(productRow).toBeVisible();

  // Associate the part with the product
  await productRow.click();
  await products.getByRole('button', { name: 'Modify' }).click();
  m = modal(page);
  const candidateMini = m.locator('.assoc .mini').first();
  await candidateMini.locator('tbody tr').filter({ hasText: partName }).click();
  await m.getByRole('button', { name: /Add/ }).click();
  const associatedMini = m.locator('.assoc .mini').nth(1);
  await expect(associatedMini.locator('tbody tr').filter({ hasText: partName })).toBeVisible();
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
  await expect(productRow).toContainText('1');

  // Modify the product
  await productRow.click();
  await products.getByRole('button', { name: 'Modify' }).click();
  m = modal(page);
  await fillField(m, 'Price', '150');
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
  await expect(productRow).toContainText('$150.00');

  // Search part by name
  await parts.locator('.search input').fill(partName);
  await parts.getByRole('button', { name: 'Search' }).click();
  await expect(parts.locator('tbody tr')).toHaveCount(1);
  await expect(parts.locator('tbody tr').first()).toContainText(partName);

  // Search part by id
  const partId = await parts.locator('tbody tr').first().locator('td').first().textContent() ?? '';
  await parts.locator('.search input').fill(partId);
  await parts.getByRole('button', { name: 'Search' }).click();
  await expect(parts.locator('tbody tr')).toHaveCount(1);
  await expect(parts.locator('tbody tr').first()).toContainText(partName);

  // Search product by name
  await products.locator('.search input').fill(productName);
  await products.getByRole('button', { name: 'Search' }).click();
  await expect(products.locator('tbody tr')).toHaveCount(1);
  await expect(products.locator('tbody tr').first()).toContainText(productName);

  // Delete part with confirmation
  page.on('dialog', async (dialog) => dialog.accept());
  await parts.locator('tbody tr').filter({ hasText: partName }).click();
  await parts.getByRole('button', { name: 'Delete' }).click();
  await expect(parts.locator('tbody tr').filter({ hasText: partName })).not.toBeVisible();
});

test('save part with min > max is rejected', async ({ page }) => {
  const parts = partsPanel(page);
  await parts.getByRole('button', { name: 'Add' }).click();
  const m = modal(page);
  await fillField(m, 'Name', unique('BadMinMax'));
  await fillField(m, 'Inventory (In Stock)', '5');
  await fillField(m, 'Price / Cost', '1');
  await fillField(m, 'Min', '10');
  await fillField(m, 'Max', '5');
  await fillField(m, 'Machine ID', '123');
  await expect(m.getByRole('button', { name: 'Save' })).toBeDisabled();
  await expect(m.locator('.field').filter({ hasText: 'Min' }).locator('input')).toHaveClass(/invalid/);
  await expect(m.locator('.field').filter({ hasText: 'Max' }).locator('input')).toHaveClass(/invalid/);
});

test('save part with inventory outside min/max is rejected', async ({ page }) => {
  const parts = partsPanel(page);
  await parts.getByRole('button', { name: 'Add' }).click();
  const m = modal(page);
  await fillField(m, 'Name', unique('BadInv'));
  await fillField(m, 'Inventory (In Stock)', '99');
  await fillField(m, 'Price / Cost', '1');
  await fillField(m, 'Min', '1');
  await fillField(m, 'Max', '10');
  await fillField(m, 'Machine ID', '123');
  await expect(m.getByRole('button', { name: 'Save' })).toBeDisabled();
  await expect(m.locator('.field').filter({ hasText: 'Inventory (In Stock)' }).locator('input')).toHaveClass(/invalid/);
});

test('delete product that has associated parts is blocked', async ({ page }) => {
  const suffix = unique('');
  const partName = `Screw${suffix}`;
  const productName = `Table${suffix}`;

  await addPart(page, { name: partName, inStock: '4', price: '0.50', min: '1', max: '10', kind: 'In-House', variable: '42' });
  await addProduct(page, { name: productName, inStock: '1', price: '50', min: '1', max: '5' });

  const products = productsPanel(page);
  const productRow = products.locator('tbody tr').filter({ hasText: productName });
  await productRow.click();
  await products.getByRole('button', { name: 'Modify' }).click();
  let m = modal(page);
  await m.locator('.assoc .mini').first().locator('tbody tr').filter({ hasText: partName }).click();
  await m.getByRole('button', { name: /Add/ }).click();
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Unable to delete');
    await dialog.accept();
  });
  await productRow.click();
  await products.getByRole('button', { name: 'Delete' }).click();
  await expect(productRow).toBeVisible();
  await expect(productRow).toContainText('1');
});

test('switch In-House/Outsourced and validate machineId/companyName fields', async ({ page }) => {
  const parts = partsPanel(page);

  await parts.getByRole('button', { name: 'Add' }).click();
  let m = modal(page);
  await expect(m.locator('.field').filter({ hasText: 'Machine ID' })).toBeVisible();
  const partName = unique('Gear');
  await fillField(m, 'Name', partName);
  await fillField(m, 'Inventory (In Stock)', '3');
  await fillField(m, 'Price / Cost', '20');
  await fillField(m, 'Min', '1');
  await fillField(m, 'Max', '10');
  await fillField(m, 'Machine ID', '9876');
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
  const gearRow = parts.locator('tbody tr').filter({ hasText: partName });
  await expect(gearRow).toContainText('In-House');
  await expect(gearRow).toContainText('9876');

  await parts.getByRole('button', { name: 'Add' }).click();
  m = modal(page);
  await selectKind(m, 'Outsourced');
  await expect(m.locator('.field').filter({ hasText: 'Company Name' })).toBeVisible();
  await expect(m.locator('.field').filter({ hasText: 'Machine ID' })).not.toBeVisible();
  const boltName = unique('Bolt');
  await fillField(m, 'Name', boltName);
  await fillField(m, 'Inventory (In Stock)', '4');
  await fillField(m, 'Price / Cost', '5');
  await fillField(m, 'Min', '1');
  await fillField(m, 'Max', '10');
  await fillField(m, 'Company Name', 'Fasteners Inc');
  await m.getByRole('button', { name: 'Save' }).click();
  await expect(m).not.toBeVisible();
  const boltRow = parts.locator('tbody tr').filter({ hasText: boltName });
  await expect(boltRow).toContainText('Outsourced');
  await expect(boltRow).toContainText('Fasteners Inc');

  await parts.getByRole('button', { name: 'Add' }).click();
  m = modal(page);
  await fillField(m, 'Name', unique('EmptyVar'));
  await fillField(m, 'Inventory (In Stock)', '2');
  await fillField(m, 'Price / Cost', '1');
  await fillField(m, 'Min', '1');
  await fillField(m, 'Max', '5');
  await expect(m.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('cancel a modal and return to main screen', async ({ page }) => {
  const parts = partsPanel(page);
  await parts.getByRole('button', { name: 'Add' }).click();
  const m = modal(page);
  await expect(m.locator('h2')).toHaveText('Add Part');
  await m.getByRole('button', { name: 'Cancel' }).click();
  await expect(m).not.toBeVisible();
  await expect(page.locator('h1')).toContainText('Inventory Management System');
});

test('save product with non-numeric input is rejected', async ({ page }) => {
  const products = productsPanel(page);
  await products.getByRole('button', { name: 'Add' }).click();
  const m = modal(page);
  await fillField(m, 'Name', unique('Gadget'));
  await fillField(m, 'Inventory (In Stock)', 'abc');
  await fillField(m, 'Price', '10');
  await fillField(m, 'Min', '1');
  await fillField(m, 'Max', '10');
  await expect(m.getByRole('button', { name: 'Save' })).toBeDisabled();
  await expect(m.locator('.field').filter({ hasText: 'Inventory (In Stock)' }).locator('input')).toHaveClass(/invalid/);
});
