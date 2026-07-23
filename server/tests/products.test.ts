import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Products API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(':memory:');
  });

  it('GET /api/products returns seeded products with associatedParts', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ productId: 1, name: 'Motorcycle', associatedParts: [] });
    expect(res.body[1]).toMatchObject({ productId: 2, name: 'Boat', associatedParts: [] });
    expect(res.body[2]).toMatchObject({ productId: 3, name: 'Plane', associatedParts: [] });
  });

  it('GET /api/products?search filters by name substring', async () => {
    const res = await request(app).get('/api/products?search=boat');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Boat');
  });

  it('GET /api/products?search filters by exact productId string', async () => {
    const res = await request(app).get('/api/products?search=3');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Plane');
  });

  it('POST /api/products creates a product with associated parts', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Car',
      price: 25000,
      inStock: 2,
      min: 1,
      max: 5,
      associatedPartIds: [1, 2],
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ productId: 4, name: 'Car' });
    expect(res.body.associatedParts).toHaveLength(2);
    expect(res.body.associatedParts.map((p: { partId: number }) => p.partId).sort()).toEqual([1, 2]);
  });

  it('POST /api/products rejects invalid associated part id', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Car',
      price: 25000,
      inStock: 2,
      min: 1,
      max: 5,
      associatedPartIds: [99],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/associated/i);
  });

  it('PUT /api/products/:id updates associations', async () => {
    await request(app).post('/api/products').send({
      name: 'Car',
      price: 25000,
      inStock: 2,
      min: 1,
      max: 5,
      associatedPartIds: [1],
    });

    const res = await request(app).put('/api/products/4').send({
      name: 'Sports Car',
      price: 50000,
      inStock: 1,
      min: 1,
      max: 3,
      associatedPartIds: [2, 3],
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Sports Car');
    expect(res.body.associatedParts).toHaveLength(2);
    expect(res.body.associatedParts.map((p: { partId: number }) => p.partId).sort()).toEqual([2, 3]);
  });

  it('DELETE /api/products/:id is blocked when product has associated parts', async () => {
    await request(app).post('/api/products').send({
      name: 'Car',
      price: 25000,
      inStock: 2,
      min: 1,
      max: 5,
      associatedPartIds: [1],
    });

    const res = await request(app).delete('/api/products/4');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot delete/i);
  });

  it('DELETE /api/products/:id removes product without associated parts', async () => {
    const res = await request(app).delete('/api/products/1');
    expect(res.status).toBe(204);

    const get = await request(app).get('/api/products/1');
    expect(get.status).toBe(404);
  });

  it('validates min <= max and inventory range', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Car',
      price: 100,
      inStock: 10,
      min: 5,
      max: 3,
      associatedPartIds: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/min/i);
  });

  it('validates inventory between min and max', async () => {
    const res = await request(app).post('/api/products').send({
      name: 'Car',
      price: 100,
      inStock: 100,
      min: 1,
      max: 10,
      associatedPartIds: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inventory/i);
  });
});
