import Database from 'better-sqlite3';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS titles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL DEFAULT 0,
  genres TEXT NOT NULL DEFAULT '[]',
  cast TEXT NOT NULL DEFAULT '[]',
  rating REAL NOT NULL DEFAULT 0,
  duration_s INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'vod',
  status TEXT NOT NULL DEFAULT 'ready',
  hls_path TEXT,
  poster TEXT,
  backdrop TEXT,
  thumbs_vtt TEXT,
  subtitles TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS progress (
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  title_id TEXT NOT NULL REFERENCES titles(id),
  position_s REAL NOT NULL DEFAULT 0,
  duration_s REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, title_id)
);
CREATE TABLE IF NOT EXISTS my_list (
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  title_id TEXT NOT NULL REFERENCES titles(id),
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, title_id)
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title_id TEXT NOT NULL,
  title_name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress REAL NOT NULL DEFAULT 0,
  log TEXT NOT NULL DEFAULT '',
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export type Db = Database.Database;

export function openDb(file: string): Db {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}
