import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { logAuthAttempt } from '../repositories/authAudit.repository.js';
import { findActiveStudentByCode } from '../repositories/student.repository.js';
import { createOrganizerAccount, findOrganizerByEmail, verifyOrganizerPassword } from '../repositories/organizer.repository.js';
import { computeVoterHash } from './voterId.service.js';

const STUDENT_CODE_PATTERN = /^[A-Z]\d{5,6}$/i;
const FACULTY_OPTIONS = new Set(['FILS', 'ACS', 'ETTI', 'IE', 'IMST']);

export function getFacultyOptions() {
  return Array.from(FACULTY_OPTIONS);
}

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

export async function registerStudentAccount({ email, password, faculty }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedFaculty = String(faculty || '').trim().toUpperCase();
  if (!normalizedEmail || !password || !normalizedFaculty) {
    const err = new Error('email, password, and faculty are required');
    err.status = 400;
    err.code = 'INVALID_REGISTER_PAYLOAD';
    throw err;
  }
  if (!FACULTY_OPTIONS.has(normalizedFaculty)) {
    const err = new Error('Invalid faculty option');
    err.status = 400;
    err.code = 'INVALID_FACULTY';
    throw err;
  }

  const existing = await findOrganizerByEmail(normalizedEmail);
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    err.code = 'EMAIL_ALREADY_EXISTS';
    throw err;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  return createOrganizerAccount({
    email: normalizedEmail,
    passwordHash,
    faculty: normalizedFaculty,
    role: 'Student',
  });
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

export function assertFreshFaceVerification({ faceVerified, faceVerifiedAt }) {
  if (!config.requireFaceVerification) {
    return;
  }

  if (!faceVerified) {
    const err = new Error('Face verification is required before voter login');
    err.status = 403;
    err.code = 'FACE_VERIFICATION_REQUIRED';
    throw err;
  }

  const verifiedAt = Number(faceVerifiedAt);
  if (!Number.isFinite(verifiedAt)) {
    const err = new Error('faceVerifiedAt timestamp is required');
    err.status = 400;
    err.code = 'INVALID_FACE_VERIFICATION_TIMESTAMP';
    throw err;
  }

  const now = Date.now();
  const maxAgeMs = config.faceVerificationMaxAgeSec * 1000;
  if (now - verifiedAt > maxAgeMs) {
    const err = new Error('Face verification expired. Please verify again.');
    err.status = 403;
    err.code = 'FACE_VERIFICATION_EXPIRED';
    throw err;
  }
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
