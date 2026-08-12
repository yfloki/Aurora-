import express from 'express';
import cors from 'cors';
import { openDb } from './db';
import { PATHS, ensureDirs } from './paths';

ensureDirs();
export const db = openDb(PATHS.db);

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(4000, () => console.log('[api] http://localhost:4000'));
