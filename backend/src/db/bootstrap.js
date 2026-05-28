import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, isDatabaseEnabled } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEMO_STUDENTS = [
  { student_code: 'J24280', full_name: 'George Geru', faculty: 'FILS', active: true },
  { student_code: 'J12345', full_name: 'Ana Popescu', faculty: 'FILS', active: true },
  { student_code: 'J67890', full_name: 'Ion Ionescu', faculty: 'ACS', active: true },
  { student_code: 'J00001', full_name: 'Inactive Student', faculty: 'FILS', active: false },
];

async function applySchema(pool) {
  const sql = readFileSync(join(__dirname, '../../db/schema.sql'), 'utf8');
  await pool.query(sql);
}

async function seedDemoData(pool) {
  for (const student of DEMO_STUDENTS) {
    await pool.query(
      `INSERT INTO students (student_code, full_name, faculty, active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_code) DO UPDATE
       SET full_name = EXCLUDED.full_name, faculty = EXCLUDED.faculty, active = EXCLUDED.active`,
      [student.student_code, student.full_name, student.faculty, student.active]
    );
  }

  const passwordHash = await bcrypt.hash('admin', 10);
  await pool.query(
    `INSERT INTO organizers (email, password_hash, role)
     VALUES ($1, $2, 'Organizer')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ['admin@upb.ro', passwordHash]
  );
}

export async function autoSetupDatabaseOnStart(enabled) {
  if (!enabled) {
    return;
  }

  if (!isDatabaseEnabled()) {
    console.warn('AUTO_SEED_ON_START is enabled, but DATABASE_URL is missing. Skipping database bootstrap.');
    return;
  }

  const pool = getPool();
  await applySchema(pool);
  await seedDemoData(pool);
  console.log('Automatic database bootstrap completed (schema + seed).');
}
