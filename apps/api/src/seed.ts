import { nanoid } from 'nanoid';
import type { Db } from './db';

export interface SeedEntry {
  slug: string; name: string; synopsis: string; year: number;
  genres: string[]; cast: string[]; rating: number; durationS: number;
  hlsPath: string | null; poster: string | null; backdrop: string | null;
  thumbsVtt: string | null; subtitles: { lang: string; label: string; path: string }[];
}

export function seedCatalog(db: Db, entries: SeedEntry[]) {
  const insert = db.prepare(`
    INSERT INTO titles (id, slug, name, synopsis, year, genres, cast, rating,
      duration_s, kind, status, hls_path, poster, backdrop, thumbs_vtt, subtitles)
    VALUES (@id, @slug, @name, @synopsis, @year, @genres, @cast, @rating,
      @durationS, 'vod', 'ready', @hlsPath, @poster, @backdrop, @thumbsVtt, @subtitles)
    ON CONFLICT(slug) DO UPDATE SET
      name=excluded.name, synopsis=excluded.synopsis, year=excluded.year,
      genres=excluded.genres, cast=excluded.cast, rating=excluded.rating,
      duration_s=excluded.duration_s, hls_path=excluded.hls_path,
      poster=excluded.poster, backdrop=excluded.backdrop,
      thumbs_vtt=excluded.thumbs_vtt, subtitles=excluded.subtitles`);
  const tx = db.transaction((all: SeedEntry[]) => {
    for (const e of all) {
      insert.run({
        id: nanoid(10), ...e,
        genres: JSON.stringify(e.genres), cast: JSON.stringify(e.cast),
        subtitles: JSON.stringify(e.subtitles),
      });
    }
  });
  tx(entries);
}
