import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // generous timeouts: this is a low-traffic personal service
  max: 5,
  idleTimeoutMillis: 30_000,
});

export async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

// Small helper so routes read cleaner.
export const q = (text, params) => pool.query(text, params);
