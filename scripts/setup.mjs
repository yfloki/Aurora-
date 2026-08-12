// Roda com: npm run setup  (node >= 20; usa fetch nativo e tsx para importar TS)
import { register } from 'tsx/esm/api';
register();

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIES } from './movies.mjs';
import { ensureDubTrack } from './dub.mjs';

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

async function download(url, dest) {
  if (fs.existsSync(dest)) { console.log(`✓ já baixado: ${path.basename(dest)}`); return; }
  console.log(`↓ baixando ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const tmp = dest + '.part';
  const file = fs.createWriteStream(tmp);
  const total = Number(res.headers.get('content-length') ?? 0);
  let got = 0; let lastPct = -1;
  for await (const chunk of res.body) {
    file.write(chunk);
    got += chunk.length;
    if (total) {
      const pct = Math.floor((got / total) * 100);
      if (pct !== lastPct && pct % 5 === 0) { process.stdout.write(`\r  ${pct}%`); lastPct = pct; }
    }
  }
  file.end();
  await new Promise((r) => file.on('close', r));
  fs.renameSync(tmp, dest);
  console.log('\n  ok');
}

const failures = [];
for (const movie of MOVIES) {
  const ext = path.extname(new URL(movie.url).pathname) || '.mp4';
  const src = path.join(dirs.source, `${movie.slug}${ext}`);
  const outHls = path.join(dirs.hls, movie.slug);
  const outImg = path.join(dirs.images, movie.slug);
  try {
    await download(movie.url, src);
    if (fs.existsSync(path.join(outHls, 'master.m3u8'))) {
      console.log(`✓ já transcodificado: ${movie.slug}`);
    } else {
      // dublagem de estúdio já existente (movie.dubUrl) → segunda faixa do HLS
      const dub = await ensureDubTrack(movie, dirs.source, src);
      const audioTracks = dub
        ? [
            { lang: 'eng', name: 'original', isDefault: true },
            { file: dub, lang: 'por', name: 'dublado' },
          ]
        : undefined;
      console.log(`⚙ transcodificando ${movie.slug}${audioTracks ? ' (com faixa dublada)' : ''} (isso demora)...`);
      await transcodeToHls(src, outHls, {
        audioTracks,
        onProgress: (p) => process.stdout.write(`\r  HLS ${p.toFixed(0)}%`),
      });
      console.log('');
      await generateThumbnails(src, path.join(outHls, 'thumbs'), `hls/${movie.slug}/thumbs`);
      await extractStills(src, outImg);
    }
    // legendas de demonstração do repo → content
    const subDir = path.join(outHls, 'subs');
    for (const [srcName, destName] of [
      [`${movie.slug}.vtt`, 'pt-BR.vtt'],
      [`${movie.slug}.en.vtt`, 'en.vtt'],
      [`${movie.slug}.es.vtt`, 'es.vtt'],
    ]) {
      const subSrc = path.join(root, 'apps', 'api', 'seed', 'subs', srcName);
      if (fs.existsSync(subSrc)) {
        fs.mkdirSync(subDir, { recursive: true });
        fs.copyFileSync(subSrc, path.join(subDir, destName));
      }
    }
  } catch (err) {
    console.error(`✗ falhou ${movie.slug}: ${err.message} — seguindo com os demais`);
    failures.push(movie.slug);
  }
}

// semear catálogo apenas com o que existe de fato
const seedJson = JSON.parse(
  fs.readFileSync(path.join(root, 'apps', 'api', 'seed', 'titles.json'), 'utf8'));
const available = seedJson.filter((e) =>
  fs.existsSync(path.join(dirs.hls, e.slug, 'master.m3u8')));
const db = await openDb(path.join(dirs.db, 'pg'));
await seedCatalog(db, available);
console.log(`\n✔ setup completo: ${available.length}/${seedJson.length} títulos prontos.`);
if (failures.length) console.log(`  falharam: ${failures.join(', ')} (rode de novo para tentar só os faltantes)`);
process.exit(0);
