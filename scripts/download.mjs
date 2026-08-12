// Baixa apenas os filmes-fonte (sem transcodificar) — usado para adiantar
// os downloads enquanto o pipeline FFmpeg fica pronto. `npm run setup`
// reconhece os arquivos já baixados e pula direto para a transcodificação.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIES } from './movies.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(root, 'content', 'source');
fs.mkdirSync(sourceDir, { recursive: true });

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
      if (pct !== lastPct && pct % 10 === 0) { console.log(`  ${path.basename(dest)}: ${pct}%`); lastPct = pct; }
    }
  }
  file.end();
  await new Promise((r) => file.on('close', r));
  fs.renameSync(tmp, dest);
  console.log(`  ok: ${path.basename(dest)} (${(got / 1e6).toFixed(0)} MB)`);
}

const failures = [];
for (const movie of MOVIES) {
  const ext = path.extname(new URL(movie.url).pathname) || '.mp4';
  const dest = path.join(sourceDir, `${movie.slug}${ext}`);
  try {
    await download(movie.url, dest);
  } catch (err) {
    console.error(`✗ falhou ${movie.slug}: ${err.message}`);
    failures.push(movie.slug);
  }
}
console.log(failures.length
  ? `Downloads concluídos com falhas: ${failures.join(', ')}`
  : 'Todos os downloads concluídos.');
