import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import type { Db } from '../db';
import type { JobQueue } from '../jobs';
import { rowToTitle } from '../mappers';
import { slugify, uniqueSlug } from '../slug';

interface Opts {
  sourceDir: string;
  validate: (file: string) => Promise<number>; // retorna duração; lança se inválido
}

export function createUploadRouter(db: Db, queue: Pick<JobQueue, 'enqueue'>, opts: Opts) {
  fs.mkdirSync(opts.sourceDir, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: opts.sourceDir,
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${slugify(path.parse(file.originalname).name)}.mp4`),
    }),
    limits: { fileSize: 4 * 1024 * 1024 * 1024 },
  });

  const r = Router();
  r.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'arquivo obrigatório (campo file)' });
    const name = (req.body?.name ?? '').trim();
    if (!name) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'name obrigatório' });
    }
    try {
      await opts.validate(req.file.path);
    } catch {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'arquivo não é um vídeo válido' });
    }

    const slug = uniqueSlug(slugify(name), (s) =>
      !!db.prepare(`SELECT 1 FROM titles WHERE slug = ?`).get(s));
    const id = nanoid(10);
    const genres = String(req.body?.genres ?? '')
      .split(',').map((g: string) => g.trim()).filter(Boolean);
    db.prepare(`
      INSERT INTO titles (id, slug, name, synopsis, year, genres, status)
      VALUES (?, ?, ?, ?, ?, ?, 'processing')`)
      .run(id, slug, name, String(req.body?.synopsis ?? ''),
           parseInt(req.body?.year ?? '0', 10) || 0, JSON.stringify(genres));
    const job = queue.enqueue({ titleId: id, titleName: name, sourcePath: req.file.path });
    const title = rowToTitle(db.prepare(`SELECT * FROM titles WHERE id = ?`).get(id));
    res.status(201).json({ title, job });
  });

  return r;
}
