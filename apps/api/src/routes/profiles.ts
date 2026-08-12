import { Router } from 'express';
import { nanoid } from 'nanoid';
import type { Db } from '../db';

export function createProfilesRouter(db: Db) {
  const r = Router();

  r.get('/', (_req, res) => {
    res.json(db.prepare(`SELECT id, name, avatar FROM profiles ORDER BY created_at`).all());
  });

  r.post('/', (req, res) => {
    const { name, avatar } = req.body ?? {};
    if (!name || !avatar) return res.status(400).json({ error: 'name e avatar são obrigatórios' });
    const profile = { id: nanoid(10), name: String(name), avatar: String(avatar) };
    db.prepare(`INSERT INTO profiles (id, name, avatar) VALUES (@id, @name, @avatar)`).run(profile);
    res.status(201).json(profile);
  });

  r.delete('/:id', (req, res) => {
    db.prepare(`DELETE FROM progress WHERE profile_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM my_list WHERE profile_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM profiles WHERE id = ?`).run(req.params.id);
    res.status(204).end();
  });

  r.get('/:id/progress', (req, res) => {
    const rows = db
      .prepare(`SELECT title_id, position_s, duration_s, updated_at FROM progress
                WHERE profile_id = ? ORDER BY updated_at DESC`)
      .all(req.params.id) as any[];
    res.json(rows.map((x) => ({
      titleId: x.title_id, positionS: x.position_s, durationS: x.duration_s, updatedAt: x.updated_at,
    })));
  });

  r.put('/:id/progress/:titleId', (req, res) => {
    const { positionS, durationS } = req.body ?? {};
    if (typeof positionS !== 'number') return res.status(400).json({ error: 'positionS numérico obrigatório' });
    db.prepare(`
      INSERT INTO progress (profile_id, title_id, position_s, duration_s, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(profile_id, title_id) DO UPDATE SET
        position_s = excluded.position_s, duration_s = excluded.duration_s,
        updated_at = excluded.updated_at`)
      .run(req.params.id, req.params.titleId, positionS, durationS ?? 0);
    res.status(204).end();
  });

  r.get('/:id/list', (req, res) => {
    const rows = db.prepare(`SELECT title_id FROM my_list WHERE profile_id = ? ORDER BY added_at DESC`)
      .all(req.params.id) as any[];
    res.json(rows.map((x) => x.title_id));
  });

  r.put('/:id/list/:titleId', (req, res) => {
    db.prepare(`INSERT OR IGNORE INTO my_list (profile_id, title_id) VALUES (?, ?)`)
      .run(req.params.id, req.params.titleId);
    res.status(204).end();
  });

  r.delete('/:id/list/:titleId', (req, res) => {
    db.prepare(`DELETE FROM my_list WHERE profile_id = ? AND title_id = ?`)
      .run(req.params.id, req.params.titleId);
    res.status(204).end();
  });

  return r;
}
