import { createHash } from 'node:crypto';
import { config } from '../config.js';

/**
 * Pseudonymous voter id for on-chain use (never store raw student code on ledger).
 */
export function computeVoterHash(studentCode, electionId) {
  const normalized = String(studentCode).trim().toUpperCase();
  const payload = `${normalized}:${electionId}:${config.voterIdSalt}`;
  return createHash('sha256').update(payload).digest('hex');
}

export function voterHashToBytes32(hexHash) {
  if (!/^[a-f0-9]{64}$/i.test(hexHash)) {
    throw new Error('Invalid voter hash');
  }
  return `0x${hexHash}`;
}
