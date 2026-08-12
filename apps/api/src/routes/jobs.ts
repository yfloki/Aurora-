import { Router } from 'express';
import type { Db } from '../db';
import type { JobQueue } from '../jobs';

export function createJobsRouter(db: Db, queue: JobQueue) {
  const r = Router();

  r.get('/', (_req, res) => {
    const rows = db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC`).all() as any[];
    res.json(rows.map((x) => ({
      id: x.id, titleId: x.title_id, titleName: x.title_name,
      status: x.status, progress: x.progress, error: x.error, createdAt: x.created_at,
    })));
  });

  r.post('/:id/retry', (req, res) => {
    db.prepare(`UPDATE jobs SET status='pending', progress=0, error=NULL WHERE id=? AND status='error'`)
      .run(req.params.id);
    res.status(204).end();
  });

  r.get('/:id/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const send = (job: any) => {
      if (job.id === req.params.id || req.params.id === 'all') {
        res.write(`data: ${JSON.stringify(job)}\n\n`);
      }
    };
    queue.events.on('job', send);
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      queue.events.off('job', send);
    });
  });

  return r;
}
