import Database from 'better-sqlite3';
import type { PartInput, Product } from './types.js';

type DB = InstanceType<typeof Database>;
type ProductInput = Omit<Product, 'productId' | 'associatedParts'>;

function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNumber(value: unknown, integerOnly: boolean): number | null {
  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) return null;
    if (integerOnly && !Number.isInteger(value)) return null;
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = Number(trimmed);
    if (Number.isNaN(num) || !Number.isFinite(num)) return null;
    if (integerOnly && !Number.isInteger(num)) return null;
    return num;
  }

  return null;
}

export function validatePart(body: unknown): { error: string } | { value: PartInput } {
  if (typeof body !== 'object' || body === null) {
    return { error: 'Invalid request body.' };
  }

  const b = body as Record<string, unknown>;

  const name = parseString(b.name);
  if (name === null) return { error: 'Name is required.' };

  const price = parseNumber(b.price, false);
  if (price === null || price < 0) return { error: 'Price must be a non-negative number.' };

  const inStock = parseNumber(b.inStock, true);
  if (inStock === null) return { error: 'In stock must be an integer.' };

  const min = parseNumber(b.min, true);
  if (min === null) return { error: 'Min must be an integer.' };

  const max = parseNumber(b.max, true);
  if (max === null) return { error: 'Max must be an integer.' };

  if (min > max) return { error: 'Min must be less than or equal to max.' };
  if (inStock < min || inStock > max) return { error: 'Inventory must be between min and max.' };

  const kind = b.kind;
  if (kind !== 'inhouse' && kind !== 'outsourced') {
    return { error: 'Kind must be "inhouse" or "outsourced".' };
  }

  let machineId: number | undefined;
  let companyName: string | undefined;

  if (kind === 'inhouse') {
    const parsed = parseNumber(b.machineId, true);
    if (parsed === null) return { error: 'Machine ID is required for in-house parts.' };
    machineId = parsed;
  } else {
    const parsed = parseString(b.companyName);
    if (parsed === null) return { error: 'Company name is required for outsourced parts.' };
    companyName = parsed;
  }

  const value: PartInput = kind === 'inhouse'
    ? { name, price, inStock, min, max, kind: 'inhouse', machineId: machineId! }
    : { name, price, inStock, min, max, kind: 'outsourced', companyName: companyName! };

  return { value };
}

export function validateProduct(
  body: unknown,
  db: DB,
): { error: string } | { product: ProductInput; associatedPartIds: number[] } {
  if (typeof body !== 'object' || body === null) {
    return { error: 'Invalid request body.' };
  }

  const b = body as Record<string, unknown>;

  const name = parseString(b.name);
  if (name === null) return { error: 'Name is required.' };

  const price = parseNumber(b.price, false);
  if (price === null || price < 0) return { error: 'Price must be a non-negative number.' };

  const inStock = parseNumber(b.inStock, true);
  if (inStock === null) return { error: 'In stock must be an integer.' };

  const min = parseNumber(b.min, true);
  if (min === null) return { error: 'Min must be an integer.' };

  const max = parseNumber(b.max, true);
  if (max === null) return { error: 'Max must be an integer.' };

  if (min > max) return { error: 'Min must be less than or equal to max.' };
  if (inStock < min || inStock > max) return { error: 'Inventory must be between min and max.' };

  const associatedPartIds: number[] = [];
  if (b.associatedPartIds !== undefined) {
    if (!Array.isArray(b.associatedPartIds)) {
      return { error: 'associatedPartIds must be an array.' };
    }

    const checkPart = db.prepare('SELECT partId FROM parts WHERE partId = ?');
    for (const id of b.associatedPartIds) {
      const parsed = parseNumber(id, true);
      if (parsed === null) return { error: 'Associated part IDs must be integers.' };
      const existing = checkPart.get(parsed) as { partId: number } | undefined;
      if (!existing) return { error: 'Associated part IDs must reference existing parts.' };
      associatedPartIds.push(parsed);
    }
  }

  return { product: { name, price, inStock, min, max }, associatedPartIds };
}
