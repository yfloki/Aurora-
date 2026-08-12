import { Router } from 'express';
import type { LiveManager } from '../live';

export function createLiveRouter(manager: LiveManager) {
  const r = Router();
  r.get('/status', (_req, res) => res.json(manager.getStatus()));
  return r;
}
