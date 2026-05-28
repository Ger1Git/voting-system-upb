// ─── API ─────────────────────────────────────────────────────────────────────

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5122/api';

// ─── Auth / session ──────────────────────────────────────────────────────────

export const AUTH_COOKIE_KEY = 'token';

// ─── API paths ────────────────────────────────────────────────────────────────

export const API_PATHS = {
  login:          '/auth/login',
  register:       '/auth/register',
  faculties:      '/auth/faculties',
  badge:          '/auth/badge',
  elections:      '/elections',
  adminElections: '/admin/elections',
  votes:          '/votes',
} as const;

// ─── localStorage keys ───────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  authToken:          AUTH_COOKIE_KEY,
  voteSecrets:        'upb_vote_secrets',
  voterSessionPrefix: 'upb_voter_session_',
  studentIdPrefix:    'student_id_binding_',
  faceEnrollPrefix:   'face_enrollment_',
} as const;

// ─── Face recognition ────────────────────────────────────────────────────────

export const FACE_MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
export const FACE_MATCH_THRESHOLD = 0.5;

// ─── Demo / testing ──────────────────────────────────────────────────────────

/** Fallback student code used when face verification is disabled for testing. */
export const DEFAULT_DEMO_STUDENT_CODE = 'J24280';
