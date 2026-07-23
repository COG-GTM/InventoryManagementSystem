import { Router } from 'express';
import { getProductWithParts, type DB } from '../db.js';
import type { ProductRow } from '../types.js';
import { validateProduct } from '../validation.js';

export function createProductsRouter(db: DB) {
  const router = Router();

  router.get('/', (req, res) => {
    const term = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const rows = term === ''
      ? (db.prepare('SELECT * FROM products ORDER BY productId').all() as ProductRow[])
      : (db.prepare(`
          SELECT * FROM products
          WHERE (LOWER(name) LIKE '%' || LOWER(?) || '%' OR CAST(productId AS TEXT) = ?)
          ORDER BY productId
        `).all(term, term) as ProductRow[]);

    const products = rows.map((row) => getProductWithParts(db, row.productId));
    res.json(products);
  });

  router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const product = getProductWithParts(db, id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json(product);
  });

  router.post('/', (req, res) => {
    const validated = validateProduct(req.body, db);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    const { product, associatedPartIds } = validated;

    const insertProduct = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO products (name, price, inStock, min, max) VALUES (?, ?, ?, ?, ?)'
      ).run(product.name, product.price, product.inStock, product.min, product.max);
      const productId = Number(result.lastInsertRowid);

      const assoc = db.prepare('INSERT INTO product_parts (productId, partId) VALUES (?, ?)');
      for (const partId of associatedPartIds) {
        assoc.run(productId, partId);
      }
      return productId;
    });

    const productId = insertProduct();
    const created = getProductWithParts(db, productId);
    return res.status(201).json(created!);
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const exists = db.prepare('SELECT productId FROM products WHERE productId = ?').get(id) as { productId: number } | undefined;
    if (!exists) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const validated = validateProduct(req.body, db);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    const { product, associatedPartIds } = validated;

    const updateProduct = db.transaction(() => {
      db.prepare(
        'UPDATE products SET name = ?, price = ?, inStock = ?, min = ?, max = ? WHERE productId = ?'
      ).run(product.name, product.price, product.inStock, product.min, product.max, id);

      db.prepare('DELETE FROM product_parts WHERE productId = ?').run(id);
      const assoc = db.prepare('INSERT INTO product_parts (productId, partId) VALUES (?, ?)');
      for (const partId of associatedPartIds) {
        assoc.run(id, partId);
      }
    });

    updateProduct();
    const updated = getProductWithParts(db, id);
    return res.json(updated!);
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = db.prepare('SELECT productId FROM products WHERE productId = ?').get(id) as { productId: number } | undefined;
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const { count } = db.prepare('SELECT COUNT(*) AS count FROM product_parts WHERE productId = ?').get(id) as { count: number };
    if (count > 0) {
      return res.status(400).json({ error: 'Cannot delete a product that has associated parts.' });
    }

    db.prepare('DELETE FROM products WHERE productId = ?').run(id);
    return res.status(204).send();
  });

  return router;
}
