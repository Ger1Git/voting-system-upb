import { getPool, isDatabaseEnabled } from '../db/pool.js';

export async function logAuthAttempt({
  electionId,
  voterHash,
  studentCode,
  success,
  source,
  ipAddress,
}) {
  if (!isDatabaseEnabled()) {
    return;
  }
  await getPool().query(
    `INSERT INTO auth_audit (election_id, voter_hash, student_code, success, source, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      electionId ?? null,
      voterHash ?? null,
      studentCode ?? null,
      success,
      source,
      ipAddress ?? null,
    ]
  );
}
