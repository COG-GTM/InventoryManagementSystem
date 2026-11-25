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
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error & { type?: string; status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON body.' });
      return;
    }
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request body too large.' });
      return;
    }
    if (err.status && err.status >= 400 && err.status < 500) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
