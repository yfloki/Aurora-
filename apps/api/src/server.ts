import express from 'express';
import cors from 'cors';
import { openDb } from './db';
import { PATHS, ensureDirs } from './paths';
import { bootstrapSeed } from './bootstrap-seed';
import { createTitlesRouter } from './routes/titles';
import { createProfilesRouter } from './routes/profiles';

ensureDirs();
export const db = openDb(PATHS.db);
bootstrapSeed(db);

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/titles', createTitlesRouter(db));
app.use('/api/profiles', createProfilesRouter(db));

// Rotas de jobs/upload/live entram nas Tasks 7–9 (agentes ruflo).
// Até lá, /api/live/status responde inativo para a home não quebrar.
app.get('/api/live/status', (_req, res) =>
  res.json({ active: false, key: null, hlsPath: null, startedAt: null }));
app.get('/api/jobs', (_req, res) => res.json([]));

app.listen(4000, () => console.log('[api] http://localhost:4000'));
