import bcrypt from 'bcryptjs';
import { getPool, isDatabaseEnabled } from '../src/db/pool.js';

const DEMO_STUDENTS = [
  { student_code: 'J24280', full_name: 'George Geru', faculty: 'FILS', active: true },
  { student_code: 'J12345', full_name: 'Ana Popescu', faculty: 'FILS', active: true },
  { student_code: 'J67890', full_name: 'Ion Ionescu', faculty: 'ACS', active: true },
  { student_code: 'J00001', full_name: 'Inactive Student', faculty: 'FILS', active: false },
];

async function main() {
  if (!isDatabaseEnabled()) {
    console.error('Set DATABASE_URL in backend/.env first.');
    process.exit(1);
  }

  const pool = getPool();

  for (const s of DEMO_STUDENTS) {
    await pool.query(
      `INSERT INTO students (student_code, full_name, faculty, active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_code) DO UPDATE
       SET full_name = EXCLUDED.full_name, faculty = EXCLUDED.faculty, active = EXCLUDED.active`,
      [s.student_code, s.full_name, s.faculty, s.active]
    );
  }

  const passwordHash = await bcrypt.hash('admin', 10);
  await pool.query(
    `INSERT INTO organizers (email, password_hash, role)
     VALUES ($1, $2, 'Organizer')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ['admin@upb.ro', passwordHash]
  );

  console.log('Seeded students (mock UPB registry) and organizer admin@upb.ro / admin');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
