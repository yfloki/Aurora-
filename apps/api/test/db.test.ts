import { describe, it, expect } from 'vitest';
import { openDb } from '../src/db';

describe('schema', () => {
  it('cria todas as tabelas', () => {
    const db = openDb(':memory:');
    const names = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all()
      .map((r: any) => r.name);
    for (const t of ['titles', 'profiles', 'progress', 'my_list', 'jobs']) {
      expect(names).toContain(t);
    }
  });

  it('progress tem PK composta (upsert substitui)', () => {
    const db = openDb(':memory:');
    db.prepare(`INSERT INTO titles (id, slug, name) VALUES ('t1','t1','T')`).run();
    db.prepare(`INSERT INTO profiles (id, name, avatar) VALUES ('p1','Leo','red')`).run();
    const up = db.prepare(`
      INSERT INTO progress (profile_id, title_id, position_s, duration_s, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(profile_id, title_id) DO UPDATE SET position_s=excluded.position_s`);
    up.run('p1', 't1', 10, 600);
    up.run('p1', 't1', 99, 600);
    const rows = db.prepare(`SELECT * FROM progress`).all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].position_s).toBe(99);
  });
});
