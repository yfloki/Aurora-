import express from 'express';
import cors from 'cors';
import { openDb } from './db';
import { PATHS, ensureDirs } from './paths';
import { bootstrapSeed } from './bootstrap-seed';
import { createTitlesRouter } from './routes/titles';
import { createProfilesRouter } from './routes/profiles';
import { createLiveManager } from './live';
import { createLiveRouter } from './routes/live';
import { createJobQueue } from './jobs';
import { createJobsRouter } from './routes/jobs';
import { createUploadRouter } from './routes/upload';
import { transcodeToHls, generateThumbnails, extractStills, probeDuration } from './transcode';

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

export const queue = createJobQueue(db, {
  transcode: transcodeToHls, thumbnails: generateThumbnails,
  stills: extractStills, probe: probeDuration,
  hlsDir: PATHS.hls, imagesDir: PATHS.images,
});
app.use('/api/jobs', createJobsRouter(db, queue));
app.use('/api/upload', createUploadRouter(db, queue, {
  sourceDir: PATHS.source,
  validate: probeDuration,
}));
setInterval(() => queue.tick(), 2000);

app.listen(4000, () => console.log('[api] http://localhost:4000'));
