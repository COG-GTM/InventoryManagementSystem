import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Parts API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(':memory:');
  });

  it('GET /api/parts returns seeded parts sorted by partId', async () => {
    const res = await request(app).get('/api/parts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ partId: 1, name: 'Light' });
    expect(res.body[1]).toMatchObject({ partId: 2, name: 'Engine' });
    expect(res.body[2]).toMatchObject({ partId: 3, name: 'Software' });
  });

  it('GET /api/parts?search filters by name substring', async () => {
    const res = await request(app).get('/api/parts?search=Eng');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Engine');
  });

  it('GET /api/parts?search filters by exact partId string', async () => {
    const res = await request(app).get('/api/parts?search=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Light');
  });

  it('GET /api/parts?search with empty term returns all', async () => {
    const res = await request(app).get('/api/parts?search=');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('GET /api/parts/:id returns a single part', async () => {
    const res = await request(app).get('/api/parts/2');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ partId: 2, name: 'Engine', kind: 'outsourced' });
  });

  it('GET /api/parts/:id returns 404 for missing part', async () => {
    const res = await request(app).get('/api/parts/99');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/parts creates an outsourced part', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Brake',
      price: 45.5,
      inStock: 10,
      min: 1,
      max: 20,
      kind: 'outsourced',
      companyName: 'Acme Co.',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ partId: 4, name: 'Brake', kind: 'outsourced', companyName: 'Acme Co.' });
  });

  it('POST /api/parts creates an inhouse part', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Gear',
      price: 12,
      inStock: 5,
      min: 1,
      max: 50,
      kind: 'inhouse',
      machineId: 777,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ partId: 4, name: 'Gear', kind: 'inhouse', machineId: 777 });
  });

  it('POST /api/parts rejects missing name', async () => {
    const res = await request(app).post('/api/parts').send({
      price: 10,
      inStock: 1,
      min: 0,
      max: 10,
      kind: 'inhouse',
      machineId: 1,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('POST /api/parts rejects negative price', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Widget',
      price: -1,
      inStock: 1,
      min: 0,
      max: 10,
      kind: 'inhouse',
      machineId: 1,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/price/i);
  });

  it('POST /api/parts rejects min greater than max', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Widget',
      price: 10,
      inStock: 5,
      min: 10,
      max: 5,
      kind: 'inhouse',
      machineId: 1,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/min/i);
  });

  it('POST /api/parts rejects inventory outside min/max', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Widget',
      price: 10,
      inStock: 15,
      min: 0,
      max: 10,
      kind: 'inhouse',
      machineId: 1,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inventory/i);
  });

  it('POST /api/parts rejects inhouse part without machineId', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Widget',
      price: 10,
      inStock: 1,
      min: 0,
      max: 10,
      kind: 'inhouse',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/machine/i);
  });

  it('POST /api/parts rejects outsourced part without companyName', async () => {
    const res = await request(app).post('/api/parts').send({
      name: 'Widget',
      price: 10,
      inStock: 1,
      min: 0,
      max: 10,
      kind: 'outsourced',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/company/i);
  });

  it('PUT /api/parts/:id updates a part', async () => {
    const res = await request(app).put('/api/parts/1').send({
      name: 'Headlight',
      price: 30,
      inStock: 8,
      min: 2,
      max: 15,
      kind: 'outsourced',
      companyName: 'Bright Inc.',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ partId: 1, name: 'Headlight', kind: 'outsourced', companyName: 'Bright Inc.' });
    expect(res.body).not.toHaveProperty('machineId');
  });

  it('PUT /api/parts/:id returns 404 for missing part', async () => {
    const res = await request(app).put('/api/parts/99').send({
      name: 'Ghost',
      price: 1,
      inStock: 1,
      min: 0,
      max: 10,
      kind: 'inhouse',
      machineId: 1,
    });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/parts/:id removes the part from the list but keeps associations', async () => {
    // Associate part 1 with product 1
    await request(app).post('/api/products').send({
      name: 'Bike',
      price: 100,
      inStock: 1,
      min: 1,
      max: 5,
      associatedPartIds: [1],
    });

    await request(app).delete('/api/parts/1').expect(204);

    const list = await request(app).get('/api/parts');
    expect(list.body.find((p: { partId: number }) => p.partId === 1)).toBeUndefined();

    const get = await request(app).get('/api/parts/1');
    expect(get.status).toBe(404);

    const product = await request(app).get('/api/products/4');
    expect(product.status).toBe(200);
    expect(product.body.associatedParts).toHaveLength(1);
    expect(product.body.associatedParts[0].partId).toBe(1);
  });
});
