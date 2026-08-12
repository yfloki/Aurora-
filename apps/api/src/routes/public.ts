import { Router } from 'express';
import type { Db } from '../db';

/**
 * Endpoints públicos (sem auth) para a landing page:
 * apenas metadados de vitrine — nome, pôster e nota. Nada de conteúdo.
 */
export function createPublicRouter(db: Db) {
  const r = Router();

  r.get('/featured', async (_req, res) => {
    const result = await db.query(
      `SELECT id, name, poster, rating FROM titles
       WHERE status = 'ready' AND hls_path IS NOT NULL
       ORDER BY rating DESC LIMIT 10`);
    res.json(result.rows);
  });

  return r;
}
