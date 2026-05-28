import { getPool, isDatabaseEnabled } from '../db/pool.js';

/**
 * Mock UPB student registry backed by PostgreSQL `students` table.
 */
export async function findActiveStudentByCode(studentCode) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const { rows } = await getPool().query(
    `SELECT student_code, full_name, faculty, active
     FROM students
     WHERE student_code = $1 AND active = TRUE`,
    [studentCode]
  );
  return rows[0] ?? null;
}

export async function listStudents(limit = 50) {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const { rows } = await getPool().query(
    `SELECT student_code, full_name, faculty, active
     FROM students
     ORDER BY student_code
     LIMIT $1`,
    [limit]
  );
  return rows;
}
