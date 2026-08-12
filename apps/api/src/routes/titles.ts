import { Router } from 'express';
import type { Db } from '../db';
import { rowToTitle } from '../mappers';

export function createTitlesRouter(db: Db) {
  const r = Router();

  r.get('/', (req, res) => {
    const { query, genre } = req.query as { query?: string; genre?: string };
    let rows = db.prepare(`SELECT * FROM titles ORDER BY created_at DESC`).all() as any[];
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (t) => t.name.toLowerCase().includes(q) || t.synopsis.toLowerCase().includes(q),
      );
    }
    if (genre) rows = rows.filter((t) => JSON.parse(t.genres).includes(genre));
    res.json(rows.map(rowToTitle));
  });

  r.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM titles WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'título não encontrado' });
    res.json(rowToTitle(row));
  });

  return r;
}
