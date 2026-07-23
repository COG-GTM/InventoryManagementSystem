import { Router } from 'express';
import { partRowToPart, type DB } from '../db.js';
import type { InhousePartInput, OutsourcedPartInput, PartRow } from '../types.js';
import { validatePart } from '../validation.js';

export function createPartsRouter(db: DB) {
  const router = Router();

  router.get('/', (req, res) => {
    const term = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const rows = term === ''
      ? (db.prepare('SELECT * FROM parts WHERE deleted = 0 ORDER BY partId').all() as PartRow[])
      : (db.prepare(`
          SELECT * FROM parts WHERE deleted = 0
            AND (LOWER(name) LIKE '%' || LOWER(?) || '%' OR CAST(partId AS TEXT) = ?)
          ORDER BY partId
        `).all(term, term) as PartRow[]);
    res.json(rows.map(partRowToPart));
  });

  router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: 'Part not found.' });
    }
    const row = db.prepare('SELECT * FROM parts WHERE partId = ? AND deleted = 0').get(id) as PartRow | undefined;
    if (!row) {
      return res.status(404).json({ error: 'Part not found.' });
    }
    return res.json(partRowToPart(row));
  });

  router.post('/', (req, res) => {
    const validated = validatePart(req.body);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    const { name, price, inStock, min, max, kind } = validated.value;
    const machineId = kind === 'inhouse' ? (validated.value as InhousePartInput).machineId : null;
    const companyName = kind === 'outsourced' ? (validated.value as OutsourcedPartInput).companyName : null;

    const result = db.prepare(
      'INSERT INTO parts (name, price, inStock, min, max, kind, machineId, companyName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, price, inStock, min, max, kind, machineId, companyName);

    const row = db.prepare('SELECT * FROM parts WHERE partId = ?').get(Number(result.lastInsertRowid)) as PartRow;
    return res.status(201).json(partRowToPart(row));
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    const validated = validatePart(req.body);
    if ('error' in validated) {
      return res.status(400).json({ error: validated.error });
    }

    const { name, price, inStock, min, max, kind } = validated.value;
    const machineId = kind === 'inhouse' ? (validated.value as InhousePartInput).machineId : null;
    const companyName = kind === 'outsourced' ? (validated.value as OutsourcedPartInput).companyName : null;

    const result = db.prepare(
      'UPDATE parts SET name = ?, price = ?, inStock = ?, min = ?, max = ?, kind = ?, machineId = ?, companyName = ? WHERE partId = ? AND deleted = 0'
    ).run(name, price, inStock, min, max, kind, machineId, companyName, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    const row = db.prepare('SELECT * FROM parts WHERE partId = ?').get(id) as PartRow;
    return res.json(partRowToPart(row));
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    const existing = db.prepare('SELECT partId FROM parts WHERE partId = ?').get(id) as { partId: number } | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    db.prepare('UPDATE parts SET deleted = 1 WHERE partId = ?').run(id);
    return res.status(204).send();
  });

  return router;
}
