import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { createPartsRouter } from './routes/parts.js';
import { createProductsRouter } from './routes/products.js';

export function createApp(dbPath?: string) {
  const app = express();
  const db = initDb(dbPath);

  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.use('/api/parts', createPartsRouter(db));
  app.use('/api/products', createProductsRouter(db));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error & { type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON body.' });
      return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
