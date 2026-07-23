import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Part, PartRow, Product, ProductRow } from './types.js';

export type DB = InstanceType<typeof Database>;

export function initDb(dbPath: string = process.env.DATABASE_URL || 'ims.db'): DB {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath)) || '.';
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  createTables(db);
  seedIfEmpty(db);
  return db;
}

function createTables(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS parts (
      partId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      inStock INTEGER NOT NULL,
      min INTEGER NOT NULL,
      max INTEGER NOT NULL,
      kind TEXT NOT NULL,
      machineId INTEGER,
      companyName TEXT,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      productId INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      inStock INTEGER NOT NULL,
      min INTEGER NOT NULL,
      max INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_parts (
      productId INTEGER NOT NULL,
      partId INTEGER NOT NULL,
      PRIMARY KEY (productId, partId)
    );
  `);
}

function seedIfEmpty(db: DB): void {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM parts').get() as { total: number };
  if (total > 0) return;

  const partStmt = db.prepare(
    'INSERT INTO parts (partId, name, price, inStock, min, max, kind, machineId, companyName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const parts: Array<[number, string, number, number, number, number, string, number | null, string | null]> = [
    [1, 'Light', 25.25, 12, 4, 20, 'outsourced', null, 'New Paths Inc.'],
    [2, 'Engine', 500, 5, 1, 10, 'outsourced', null, 'Ford Motor Co.'],
    [3, 'Software', 300, 7, 1, 100, 'inhouse', 10101, null],
  ];
  for (const p of parts) partStmt.run(...p);

  const productStmt = db.prepare(
    'INSERT INTO products (productId, name, price, inStock, min, max) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const products: Array<[number, string, number, number, number, number]> = [
    [1, 'Motorcycle', 240000, 3, 1, 10],
    [2, 'Boat', 15000, 1, 1, 1],
    [3, 'Plane', 1090000, 2, 1, 2],
  ];
  for (const p of products) productStmt.run(...p);
}

export function partRowToPart(row: PartRow): Part {
  const base = {
    partId: row.partId,
    name: row.name,
    price: row.price,
    inStock: row.inStock,
    min: row.min,
    max: row.max,
  };

  if (row.kind === 'inhouse') {
    return { ...base, kind: 'inhouse', machineId: row.machineId as number };
  }

  return { ...base, kind: 'outsourced', companyName: row.companyName as string };
}

export function getProductWithParts(db: DB, productId: number): Product | null {
  const product = db.prepare('SELECT * FROM products WHERE productId = ?').get(productId) as ProductRow | undefined;
  if (!product) return null;

  const parts = db.prepare(`
    SELECT p.* FROM product_parts pp
    JOIN parts p ON p.partId = pp.partId
    WHERE pp.productId = ?
    ORDER BY p.partId
  `).all(productId) as PartRow[];

  return { ...product, associatedParts: parts.map(partRowToPart) };
}
