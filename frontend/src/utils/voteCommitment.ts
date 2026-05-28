import { keccak256, solidityPacked } from 'ethers';

/**
 * Compute on-chain commitment (must match VotingElection.sol).
 * Run in browser so backend never needs candidateId/nonce at rest.
 */
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

const STORAGE_KEY = 'upb_vote_secrets';

export type VoteSecret = {
  electionId: number;
  candidateId: number;
  nonce: string;
  commitment: string;
};

export function saveVoteSecret(secret: VoteSecret): void {
  const key = `${STORAGE_KEY}_${secret.electionId}`;
  localStorage.setItem(key, JSON.stringify(secret));
}

export function loadVoteSecret(electionId: number): VoteSecret | null {
  const raw = localStorage.getItem(`${STORAGE_KEY}_${electionId}`);
  if (!raw) return null;
  return JSON.parse(raw) as VoteSecret;
}
