import { EventEmitter } from 'node:events';
import path from 'node:path';
import { nanoid } from 'nanoid';
import type { Db } from './db';
import type { Job } from '@aurora/shared';

interface Deps {
  transcode: (input: string, outDir: string, opts?: { onProgress?: (p: number) => void }) => Promise<void>;
  thumbnails: (input: string, outDir: string, mediaPrefix: string) => Promise<void>;
  stills: (input: string, outDir: string) => Promise<void>;
  probe: (input: string) => Promise<number>;
  hlsDir: string;
  imagesDir: string;
}

function rowToJob(row: any): Job {
  return {
    id: row.id, titleId: row.title_id, titleName: row.title_name,
    status: row.status, progress: row.progress, error: row.error, createdAt: row.created_at,
  };
}

export function createJobQueue(db: Db, deps: Deps) {
  const events = new EventEmitter();
  events.setMaxListeners(100);
  let busy = false;

  function update(id: string, fields: Record<string, unknown>) {
    const sets = Object.keys(fields).map((k) => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE jobs SET ${sets}, updated_at = datetime('now') WHERE id = @id`)
      .run({ id, ...fields });
    events.emit('job', rowToJob(db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id)));
  }

  function enqueue(input: { titleId: string; titleName: string; sourcePath: string }): Job {
    const id = nanoid(10);
    db.prepare(`INSERT INTO jobs (id, title_id, title_name, source_path) VALUES (?, ?, ?, ?)`)
      .run(id, input.titleId, input.titleName, input.sourcePath);
    const job = rowToJob(db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id));
    events.emit('job', job);
    return job;
  }

  async function tick(): Promise<void> {
    if (busy) return;
    const row = db.prepare(`SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at LIMIT 1`).get() as any;
    if (!row) return;
    busy = true;
    try {
      update(row.id, { status: 'running', progress: 0 });
      const title = db.prepare(`SELECT * FROM titles WHERE id = ?`).get(row.title_id) as any;
      const slug = title.slug;
      const outHls = path.join(deps.hlsDir, slug);
      const outImages = path.join(deps.imagesDir, slug);

      await deps.transcode(row.source_path, outHls, {
        onProgress: (p) => update(row.id, { progress: Math.round(p * 0.8) }),
      });
      update(row.id, { progress: 85 });
      await deps.thumbnails(row.source_path, path.join(outHls, 'thumbs'), `hls/${slug}/thumbs`);
      update(row.id, { progress: 95 });
      await deps.stills(row.source_path, outImages);
      const duration = await deps.probe(row.source_path);

      db.prepare(`UPDATE titles SET status='ready', hls_path=?, poster=?, backdrop=?, thumbs_vtt=?, duration_s=? WHERE id=?`)
        .run(`hls/${slug}/master.m3u8`, `images/${slug}/poster.jpg`, `images/${slug}/backdrop.jpg`,
             `hls/${slug}/thumbs/thumbnails.vtt`, Math.round(duration), row.title_id);
      update(row.id, { status: 'done', progress: 100 });
    } catch (err: any) {
      db.prepare(`UPDATE titles SET status='error' WHERE id=?`).run(row.title_id);
      update(row.id, { status: 'error', error: String(err?.message ?? err).slice(0, 8000) });
    } finally {
      busy = false;
    }
  }

  return { enqueue, tick, events };
}

export type JobQueue = ReturnType<typeof createJobQueue>;
