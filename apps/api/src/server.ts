import express from 'express';
import cors from 'cors';
import { openDb } from './db';
import { PATHS, ensureDirs } from './paths';
import { bootstrapSeed } from './bootstrap-seed';
import { createTitlesRouter } from './routes/titles';
import { createProfilesRouter } from './routes/profiles';
import { createLiveManager } from './live';
import { createLiveRouter } from './routes/live';

ensureDirs();
export const db = openDb(PATHS.db);
bootstrapSeed(db);

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/titles', createTitlesRouter(db));
app.use('/api/profiles', createProfilesRouter(db));

const live = createLiveManager({ hlsDir: PATHS.hls });
live.start();
app.use('/api/live', createLiveRouter(live));

// Rotas de jobs/upload entram nas Tasks 7–8 (agente ruflo em andamento).
app.get('/api/jobs', (_req, res) => res.json([]));

app.listen(4000, () => console.log('[api] http://localhost:4000'));
