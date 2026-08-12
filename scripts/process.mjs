// Transcodifica e semeia APENAS os fontes já 100% baixados (sem .part).
// Pode rodar várias vezes; pula o que já foi processado. Não baixa nada.
// Uso: node scripts/process.mjs [slug]   (sem slug = todos os disponíveis)
import { register } from 'tsx/esm/api';
register();

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIES } from './movies.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const content = path.join(root, 'content');
const dirs = {
  source: path.join(content, 'source'),
  hls: path.join(content, 'hls'),
  images: path.join(content, 'images'),
  db: path.join(content, 'db'),
};
for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true });

const { transcodeToHls, generateThumbnails, extractStills } =
  await import('../apps/api/src/transcode.ts');
const { openDb } = await import('../apps/api/src/db.ts');
const { seedCatalog } = await import('../apps/api/src/seed.ts');

const only = process.argv[2];

for (const movie of MOVIES) {
  if (only && movie.slug !== only) continue;
  const urlPath = new URL(movie.url).pathname;
  const ext = (urlPath.endsWith('.zip')
    ? path.extname(urlPath.slice(0, -4))
    : path.extname(urlPath)) || '.mp4';
  const src = path.join(dirs.source, `${movie.slug}${ext}`);
  if (!fs.existsSync(src)) { console.log(`… sem fonte ainda: ${movie.slug}`); continue; }
  const outHls = path.join(dirs.hls, movie.slug);
  const outImg = path.join(dirs.images, movie.slug);
  try {
    if (fs.existsSync(path.join(outHls, 'master.m3u8'))) {
      console.log(`✓ já transcodificado: ${movie.slug}`);
    } else {
      // faixa dublada opcional: content/source/<slug>.dub.m4a (gerada por make-dub.mjs)
      const dub = path.join(dirs.source, `${movie.slug}.dub.m4a`);
      const audioTracks = fs.existsSync(dub)
        ? [
            { lang: 'eng', name: 'original', isDefault: true },
            { file: dub, lang: 'por', name: 'dublado' },
          ]
        : undefined;
      console.log(`⚙ transcodificando ${movie.slug}${audioTracks ? ' (com faixa dublada)' : ''} (isso demora)...`);
      let last = -1;
      await transcodeToHls(src, outHls, {
        audioTracks,
        onProgress: (p) => {
          const pct = Math.floor(p);
          if (pct !== last && pct % 5 === 0) { console.log(`  HLS ${movie.slug}: ${pct}%`); last = pct; }
        },
      });
      await generateThumbnails(src, path.join(outHls, 'thumbs'), `hls/${movie.slug}/thumbs`);
      await extractStills(src, outImg);
      console.log(`✔ pronto: ${movie.slug}`);
    }
    const subDir = path.join(outHls, 'subs');
    for (const [srcName, destName] of [
      [`${movie.slug}.vtt`, 'pt-BR.vtt'],
      [`${movie.slug}.en.vtt`, 'en.vtt'],
    ]) {
      const subSrc = path.join(root, 'apps', 'api', 'seed', 'subs', srcName);
      if (fs.existsSync(subSrc)) {
        fs.mkdirSync(subDir, { recursive: true });
        fs.copyFileSync(subSrc, path.join(subDir, destName));
      }
    }
  } catch (err) {
    console.error(`✗ falhou ${movie.slug}: ${err.message}`);
  }
}

// resemeia o catálogo com o que existe (o bootstrap da API também faz isso na subida)
const seedJson = JSON.parse(
  fs.readFileSync(path.join(root, 'apps', 'api', 'seed', 'titles.json'), 'utf8')
    .replace(/^﻿/, ''));
const inContent = (rel) => rel && fs.existsSync(path.join(content, rel)) ? rel : null;
const db = openDb(path.join(dirs.db, 'app.db'));
seedCatalog(db, seedJson.map((e) => ({
  ...e,
  hlsPath: inContent(e.hlsPath),
  poster: inContent(e.poster),
  backdrop: inContent(e.backdrop),
  thumbsVtt: inContent(e.thumbsVtt),
  subtitles: e.subtitles.filter((s) => inContent(s.path)),
})));
const ready = seedJson.filter((e) => inContent(e.hlsPath)).map((e) => e.slug);
console.log(`\n✔ catálogo atualizado — com vídeo: ${ready.join(', ') || '(nenhum ainda)'}`);
