import { keccak256, solidityPacked } from 'ethers';
import { STORAGE_KEYS } from './constants';

export function computeVoteCommitment(
  voterHashHex: string,
  candidateId: number,
  nonceHex: string,
  electionId: number
): string {
  const voterHash = `0x${voterHashHex.replace(/^0x/, '')}`;
  const nonce = `0x${nonceHex.replace(/^0x/, '')}`;
  return keccak256(
    solidityPacked(
      ['bytes32', 'uint256', 'bytes32', 'uint256'],
      [voterHash, BigInt(candidateId), nonce, BigInt(electionId)]
    )
  );
}

export function generateNonce(): string {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type VoteSecret = {
  electionId: number;
  candidateId: number;
  nonce: string;
  commitment: string;
};

export function saveVoteSecret(secret: VoteSecret): void {
  localStorage.setItem(`${STORAGE_KEYS.voteSecrets}_${secret.electionId}`, JSON.stringify(secret));
}

export function loadVoteSecret(electionId: number): VoteSecret | null {
  const raw = localStorage.getItem(`${STORAGE_KEYS.voteSecrets}_${electionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VoteSecret;
  } catch {
    return null;
  }
}
