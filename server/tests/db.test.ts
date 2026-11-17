import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initDb } from '../src/db.js';

describe('initDb', () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('opens file databases in WAL mode', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ims-db-'));
    const db = initDb(path.join(dir, 'ims.db'));
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
    db.close();
  });
});
