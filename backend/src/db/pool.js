import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

let pool;

export function isDatabaseEnabled() {
  return Boolean(config.databaseUrl);
}

export function getPool() {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
    });
  }
  return pool;
}

export async function checkDatabaseConnection() {
  if (!isDatabaseEnabled()) {
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const result = await getPool().query('SELECT 1 AS ok');
    return { ok: result.rows[0]?.ok === 1 };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
