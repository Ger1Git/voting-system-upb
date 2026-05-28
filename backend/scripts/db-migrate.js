import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, isDatabaseEnabled } from '../src/db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!isDatabaseEnabled()) {
    console.error('Set DATABASE_URL in backend/.env first.');
    process.exit(1);
  }

  const sql = readFileSync(join(__dirname, '../db/schema.sql'), 'utf8');
  const pool = getPool();
  await pool.query(sql);
  console.log('Schema applied successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
