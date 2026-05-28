import bcrypt from 'bcryptjs';
import { getPool, isDatabaseEnabled } from '../db/pool.js';

export async function findOrganizerByEmail(email) {
  if (!isDatabaseEnabled()) {
    return null;
  }
  const { rows } = await getPool().query(
    `SELECT id, email, password_hash, role FROM organizers WHERE email = $1`,
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
  return { id: organizer.id, email: organizer.email, role: organizer.role };
}
