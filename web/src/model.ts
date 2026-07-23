// Domain model + in-memory store.
// Ported from the legacy WinForms app (model/Part.cs, Inhouse.cs, Outsourced.cs,
// Product.cs, Inventory.cs). State lives in memory, mirroring the original
// static BindingList<Part>/BindingList<Product> design -- no database, no network.

export interface PartBase {
  partId: number;
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
}

export interface InhousePart extends PartBase {
  kind: 'inhouse';
  machineId: number;
}

export interface OutsourcedPart extends PartBase {
  kind: 'outsourced';
  companyName: string;
}

export type Part = InhousePart | OutsourcedPart;

export type PartPayload = Omit<InhousePart, 'partId'> | Omit<OutsourcedPart, 'partId'>;

export interface Product {
  productId: number;
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
  associatedParts: Part[];
}

export interface ProductPayload {
  name: string;
  price: number;
  inStock: number;
  min: number;
  max: number;
  associatedPartIds: number[];
}

// Seed data ported verbatim from Inventory.fakeData().
function seedParts(): Part[] {
  return [
    { kind: 'outsourced', partId: 1, name: 'Light', inStock: 12, min: 4, max: 20, price: 25.25, companyName: 'New Paths Inc.' },
    { kind: 'outsourced', partId: 2, name: 'Engine', inStock: 5, min: 1, max: 10, price: 500, companyName: 'Ford Motor Co.' },
    { kind: 'inhouse', partId: 3, name: 'Software', inStock: 7, min: 1, max: 100, price: 300, machineId: 10101 },
  ];
}

function seedProducts(): Product[] {
  return [
    { productId: 1, name: 'Motorcycle', inStock: 3, min: 1, max: 10, price: 240000, associatedParts: [] },
    { productId: 2, name: 'Boat', inStock: 1, min: 1, max: 1, price: 15000, associatedParts: [] },
    { productId: 3, name: 'Plane', inStock: 2, min: 1, max: 2, price: 1090000, associatedParts: [] },
  ];
}

export class Inventory {
  allParts: Part[] = seedParts();
  products: Product[] = seedProducts();

  // Parts
  addPart(part: Part): void {
    this.allParts.push(part);
  }

  deletePart(part: Part): void {
    this.allParts = this.allParts.filter((p) => p !== part);
  }

  lookupPart(partId: number): Part | null {
    return this.allParts.find((p) => p.partId === partId) ?? null;
  }

  updatePart(partId: number, part: Part): void {
    const i = this.allParts.findIndex((p) => p.partId === partId);
    if (i !== -1) this.allParts[i] = part;
  }

  // Products
  addProduct(product: Product): void {
    this.products.push(product);
  }

  removeProduct(product: Product): void {
    this.products = this.products.filter((p) => p !== product);
  }

  lookupProduct(productId: number): Product | null {
    return this.products.find((p) => p.productId === productId) ?? null;
  }

  updateProduct(productId: number, product: Product): void {
    const i = this.products.findIndex((p) => p.productId === productId);
    if (i !== -1) this.products[i] = product;
  }

  // Legacy id assignment: PartID = AllParts.Count + 1, ProductID = Products.Count + 1.
  nextPartId(): number {
    return this.allParts.length + 1;
  }

  nextProductId(): number {
    return this.products.length + 1;
  }
}

export const companyOrMachine = (p: Part): string =>
  p.kind === 'inhouse' ? String(p.machineId) : p.companyName;

export function searchParts(parts: Part[], term: string): Part[] {
  const t = term.trim();
  if (t === '') return parts;
  const upper = t.toUpperCase();
  return parts.filter((p) => p.name.toUpperCase().includes(upper) || String(p.partId) === t);
}

export function searchProducts(products: Product[], term: string): Product[] {
  const t = term.trim();
  if (t === '') return products;
  const upper = t.toUpperCase();
  return products.filter((p) => p.name.toUpperCase().includes(upper) || String(p.productId) === t);
}

export interface FieldValues {
  name: string;
  inventory: string;
  price: string;
  max: string;
  min: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function withSearch(path: string, search?: string): string {
  return search ? `${path}?search=${encodeURIComponent(search)}` : path;
}

export const partsApi = {
  list: (search?: string) => apiRequest<Part[]>(withSearch('/api/parts', search)),
  get: (id: number) => apiRequest<Part>(`/api/parts/${id}`),
  create: (part: PartPayload) => apiRequest<Part>('/api/parts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(part),
  }),
  update: (id: number, part: PartPayload) => apiRequest<Part>(`/api/parts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(part),
  }),
  remove: (id: number) => apiRequest<void>(`/api/parts/${id}`, { method: 'DELETE' }),
};

export const productsApi = {
  list: (search?: string) => apiRequest<Product[]>(withSearch('/api/products', search)),
  get: (id: number) => apiRequest<Product>(`/api/products/${id}`),
  create: (product: ProductPayload) => apiRequest<Product>('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  }),
  update: (id: number, product: ProductPayload) => apiRequest<Product>(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  }),
  remove: (id: number) => apiRequest<void>(`/api/products/${id}`, { method: 'DELETE' }),
};

// Validation ported from the save handlers: min <= max, and min <= inventory <= max.
export function validateItem(v: FieldValues): string | null {
  const min = parseInt(v.min, 10);
  const max = parseInt(v.max, 10);
  const inv = parseInt(v.inventory, 10);
  if (min > max) return 'Minimum must be less than maximum.';
  if (inv > max || inv < min) return 'Inventory must be between minimum and maximum.';
  return null;
}
