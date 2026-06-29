import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data.db');

const SQL = await initSqlJs();

let sqlDb;
try {
  if (existsSync(DB_PATH)) {
    sqlDb = new SQL.Database(readFileSync(DB_PATH));
  } else {
    sqlDb = new SQL.Database();
  }
} catch (err) {
  console.warn('DB load failed, starting fresh:', err.message);
  sqlDb = new SQL.Database();
}

function save() {
  try {
    writeFileSync(DB_PATH, Buffer.from(sqlDb.export()));
  } catch (err) {
    console.error('DB save error:', err.message);
  }
}

sqlDb.run(`CREATE TABLE IF NOT EXISTS events (
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
)`);

sqlDb.run(`CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TEXT,
  updated_at TEXT
)`);

save();

function toParams(args) {
  if (args.length === 0) return null;
  if (args.length === 1) {
    const a = args[0];
    if (Array.isArray(a)) return a;
    if (a !== null && typeof a === 'object') return a;
    return [a];
  }
  return [...args];
}

const db = {
  prepare(sql) {
    return {
      all(...args) {
        const params = toParams(args);
        const stmt = sqlDb.prepare(sql);
        const rows = [];
        if (params) stmt.bind(params);
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      get(...args) {
        const params = toParams(args);
        const stmt = sqlDb.prepare(sql);
        if (params) stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      run(...args) {
        const params = toParams(args);
        if (params) sqlDb.run(sql, params);
        else sqlDb.run(sql);
        save();
        return { changes: sqlDb.getRowsModified() };
      },
    };
  },
  pragma() {},
  exec(sql) { sqlDb.exec(sql); save(); },
};

export default db;
