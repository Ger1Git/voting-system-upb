import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { logAuthAttempt } from '../repositories/authAudit.repository.js';
import { findActiveStudentByCode } from '../repositories/student.repository.js';
import { verifyOrganizerPassword } from '../repositories/organizer.repository.js';
import { computeVoterHash } from './voterId.service.js';

const STUDENT_CODE_PATTERN = /^[A-Z]\d{5,6}$/i;

export function validateStudentCode(studentCode) {
  const normalized = String(studentCode).trim().toUpperCase();
  if (!STUDENT_CODE_PATTERN.test(normalized)) {
    const err = new Error('Invalid student code format (expected e.g. J24280)');
    err.status = 400;
    err.code = 'INVALID_STUDENT_CODE';
    throw err;
  }
  return normalized;
}

/**
 * Enrollment check: mock (env) | database (PostgreSQL students) | api (HTTP).
 */
export async function verifyEnrollment(studentCode) {
  if (config.enrollmentSource === 'mock') {
    return { enrolled: true, source: 'mock' };
  }

  if (config.enrollmentSource === 'database') {
    const student = await findActiveStudentByCode(studentCode);
    if (!student) {
      return { enrolled: false, source: 'database' };
    }
    return {
      enrolled: true,
      source: 'database',
      fullName: student.full_name,
      faculty: student.faculty,
    };
  }

  if (!config.upbApiUrl) {
    const err = new Error('UPB API is not configured');
    err.status = 503;
    throw err;
  }

  const res = await fetch(`${config.upbApiUrl}/students/${encodeURIComponent(studentCode)}`, {
    headers: config.upbApiKey ? { Authorization: `Bearer ${config.upbApiKey}` } : {},
  });

  if (res.status === 404) {
    return { enrolled: false, source: 'api' };
  }
  if (!res.ok) {
    const err = new Error('UPB enrollment service unavailable');
    err.status = 503;
    throw err;
  }

  const data = await res.json();
  return { enrolled: Boolean(data.active ?? data.enrolled), source: 'api' };
}

export async function authenticateOrganizer(email, password) {
  if (config.enrollmentSource === 'database' || config.databaseUrl) {
    const organizer = await verifyOrganizerPassword(email, password);
    if (organizer) {
      return organizer;
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@upb.ro';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  if (email === adminEmail && password === adminPassword) {
    return { email, role: 'Organizer' };
  }

  return null;
}

export function issueVoterToken({ studentCode, electionId }) {
  const voterHash = computeVoterHash(studentCode, electionId);
  const token = jwt.sign(
    {
      role: 'Voter',
      electionId: Number(electionId),
      voterHash,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  return { token, voterHash, electionId: Number(electionId) };
}

export function issueOrganizerToken({ email, role = 'Organizer' }) {
  return jwt.sign({ role, email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function recordBadgeAuth({
  studentCode,
  electionId,
  voterHash,
  success,
  source,
  ipAddress,
}) {
  await logAuthAttempt({
    electionId,
    voterHash,
    studentCode,
    success,
    source,
    ipAddress,
  });
}

// Legacy export name
export const issueAdminToken = issueOrganizerToken;
