import { describe, it, expect } from 'vitest';
import { Inventory, searchParts, searchProducts, validateItem } from './model';

describe('Inventory seed data', () => {
  it('seeds 3 parts and 3 products matching the legacy fakeData()', () => {
    const inv = new Inventory();
    expect(inv.allParts.map((p) => p.name)).toEqual(['Light', 'Engine', 'Software']);
    expect(inv.products.map((p) => p.name)).toEqual(['Motorcycle', 'Boat', 'Plane']);
    expect(inv.lookupPart(3)?.kind).toBe('inhouse');
    expect(inv.lookupPart(1)?.kind).toBe('outsourced');
  });

  it('assigns ids as count + 1 (legacy behaviour)', () => {
    const inv = new Inventory();
    expect(inv.nextPartId()).toBe(4);
    expect(inv.nextProductId()).toBe(4);
  });

  it('add / update / delete parts', () => {
    const inv = new Inventory();
    inv.addPart({ kind: 'inhouse', partId: 4, name: 'Bolt', inStock: 5, min: 1, max: 10, price: 1, machineId: 7 });
    expect(inv.lookupPart(4)?.name).toBe('Bolt');
    inv.updatePart(4, { kind: 'inhouse', partId: 4, name: 'Bolt v2', inStock: 5, min: 1, max: 10, price: 1, machineId: 7 });
    expect(inv.lookupPart(4)?.name).toBe('Bolt v2');
    inv.deletePart(inv.lookupPart(4)!);
    expect(inv.lookupPart(4)).toBeNull();
  });
});

describe('search', () => {
  it('matches by name (case-insensitive) or exact id', () => {
    const inv = new Inventory();
    expect(searchParts(inv.allParts, 'eng').map((p) => p.name)).toEqual(['Engine']);
    expect(searchParts(inv.allParts, '2').map((p) => p.name)).toEqual(['Engine']);
    expect(searchProducts(inv.products, 'boat').map((p) => p.name)).toEqual(['Boat']);
    expect(searchParts(inv.allParts, '').length).toBe(3);
  });
});

describe('validation', () => {
  it('enforces min <= max and min <= inventory <= max', () => {
    expect(validateItem({ name: 'x', inventory: '5', price: '1', min: '10', max: '4' }))
      .toBe('Minimum must be less than maximum.');
    expect(validateItem({ name: 'x', inventory: '99', price: '1', min: '1', max: '10' }))
      .toBe('Inventory must be between minimum and maximum.');
    expect(validateItem({ name: 'x', inventory: '5', price: '1', min: '1', max: '10' })).toBeNull();
  });
});
