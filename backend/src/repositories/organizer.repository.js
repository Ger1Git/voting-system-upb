import bcrypt from 'bcryptjs';
import { getPool, isDatabaseEnabled } from '../db/pool.js';

export async function findOrganizerByEmail(email) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const { rows } = await getPool().query(
    `SELECT id, email, password_hash, role, faculty FROM organizers WHERE email = $1`,
    [email.toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function verifyOrganizerPassword(email, password) {
  const organizer = await findOrganizerByEmail(email);
  if (!organizer) {
    return null;
  }
  const match = await bcrypt.compare(password, organizer.password_hash);
  if (!match) {
    return null;
  }
  return { id: organizer.id, email: organizer.email, role: organizer.role, faculty: organizer.faculty };
}

export async function createOrganizerAccount({ email, passwordHash, faculty, role = 'Student' }) {
  if (!isDatabaseEnabled()) {
    const err = new Error('Database is required for account registration');
    err.status = 503;
    throw err;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedFaculty = faculty ? String(faculty).trim().toUpperCase() : null;
  const { rows } = await getPool().query(
    `INSERT INTO organizers (email, password_hash, faculty, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, faculty, role`,
    [normalizedEmail, passwordHash, normalizedFaculty, role]
  );
  return rows[0];
}
