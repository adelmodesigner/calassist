import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data.db');

let db;
try {
  db = new Database(DB_PATH);
} catch (err) {
  console.warn(`Failed to open DB at ${DB_PATH}, falling back to local:`, err.message);
  db = new Database(path.join(__dirname, '../data.db'));
}

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    title TEXT DEFAULT '',
    date TEXT DEFAULT '',
    time TEXT DEFAULT '',
    location TEXT DEFAULT '',
    description TEXT DEFAULT '',
    source TEXT NOT NULL,
    voice_duration TEXT DEFAULT '',
    google_event_id TEXT DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_tokens (
    id INTEGER PRIMARY KEY DEFAULT 1,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expiry TEXT,
    updated_at TEXT
  );
`);

export default db;
