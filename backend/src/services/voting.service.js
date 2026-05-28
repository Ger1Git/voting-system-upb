import {
  castCommitmentOnChain,
  getHasRevealed,
  getHasVoted,
  getParticipationStats,
  getResultsFromChain,
  getVoteCommitmentOnChain,
  isChainConfigured,
  revealVoteOnChain,
} from '../blockchain/blockchainClient.js';
import { computeVoteCommitment } from './commitment.service.js';
import { voterHashToBytes32 } from './voterId.service.js';

export async function getVoteStatus(electionId, voterHash) {
  if (!isChainConfigured()) {
    const err = new Error('Blockchain is not configured');
    err.status = 503;
    throw err;
  }
  const bytes32 = voterHashToBytes32(voterHash);
  const id = Number(electionId);
  const [hasVoted, hasRevealed] = await Promise.all([
    getHasVoted(id, bytes32),
    getHasRevealed(id, bytes32),
  ]);
  return { electionId: id, voterHash, hasVoted, hasRevealed };
}

/**
 * Submit a vote commitment. Prefer client-supplied commitment (backend never stores choice).
 * Fallback: compute from candidateId + nonce if client sends them (transient, not stored).
 */
export async function castVote({ electionId, voterHash, commitment, candidateId, nonce }) {
  if (!isChainConfigured()) {
    const err = new Error('Blockchain is not configured');
    err.status = 503;
    throw err;
  }

  const id = Number(electionId);
  const bytes32 = voterHashToBytes32(voterHash);

  const alreadyVoted = await getHasVoted(id, bytes32);
  if (alreadyVoted) {
    const err = new Error('You have already voted in this election');
    err.status = 409;
    err.code = 'ALREADY_VOTED';
    throw err;
  }

  let commitmentBytes = commitment;
  if (!commitmentBytes) {
    if (candidateId == null || !nonce) {
      const err = new Error('Provide commitment from client, or candidateId and nonce');
      err.status = 400;
      throw err;
    }
    commitmentBytes = computeVoteCommitment(voterHash, candidateId, nonce, id);
  }

  try {
    const receipt = await castCommitmentOnChain(id, bytes32, commitmentBytes);
    return {
      electionId: id,
      txHash: receipt.txHash,
      blockNumber: receipt.blockNumber,
      commitment: commitmentBytes,
      message:
        'Vote recorded as a commitment only. Store candidateId and nonce locally; reveal after voting closes.',
    };
  } catch (e) {
    if (e.reason?.includes('AlreadyVoted') || e.message?.includes('AlreadyVoted')) {
      const err = new Error('You have already voted in this election');
      err.status = 409;
      err.code = 'ALREADY_VOTED';
      throw err;
    }
    if (e.reason?.includes('VotingNotOpen') || e.message?.includes('VotingNotOpen')) {
      const err = new Error('Voting is not open for this election');
      err.status = 400;
      err.code = 'ELECTION_CLOSED';
      throw err;
    }
    throw e;
  }
}

/**
 * Voter reveals their own ballot after close — organizer cannot call this for all voters.
 */
export async function revealVote({ electionId, voterHash, candidateId, nonce }) {
  if (!isChainConfigured()) {
    const err = new Error('Blockchain is not configured');
    err.status = 503;
    throw err;
  }
  if (candidateId == null || !nonce) {
    const err = new Error('candidateId and nonce are required to reveal');
    err.status = 400;
    throw err;
  }

  const id = Number(electionId);
  const bytes32 = voterHashToBytes32(voterHash);

  const alreadyRevealed = await getHasRevealed(id, bytes32);
  if (alreadyRevealed) {
    const err = new Error('You have already revealed your vote');
    err.status = 409;
    err.code = 'ALREADY_REVEALED';
    throw err;
  }

  try {
    const receipt = await revealVoteOnChain(
      id,
      bytes32,
      Number(candidateId),
      voterHashToBytes32(nonce)
    );
    return {
      electionId: id,
      txHash: receipt.txHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (e) {
    if (e.reason?.includes('InvalidCommitment') || e.message?.includes('InvalidCommitment')) {
      const err = new Error('Reveal does not match your on-chain commitment');
      err.status = 400;
      err.code = 'INVALID_REVEAL';
      throw err;
    }
    if (e.reason?.includes('InvalidState') || e.message?.includes('InvalidState')) {
      const err = new Error('Reveal is only allowed after voting has closed');
      err.status = 400;
      err.code = 'REVEAL_NOT_OPEN';
      throw err;
    }
    throw e;
  }
}

export async function getVoteReceipt(electionId, voterHash) {
  if (!isChainConfigured()) {
    const err = new Error('Blockchain is not configured');
    err.status = 503;
    throw err;
  }
  const id = Number(electionId);
  const bytes32 = voterHashToBytes32(voterHash);
  const hasVoted = await getHasVoted(id, bytes32);
  if (!hasVoted) {
    return { electionId: id, voterHash, hasVoted: false, commitment: null };
  }
  const commitment = await getVoteCommitmentOnChain(id, bytes32);
  return { electionId: id, voterHash, hasVoted: true, commitment };
}

export async function getElectionParticipation(electionId) {
  if (!isChainConfigured()) {
    const err = new Error('Blockchain is not configured');
    err.status = 503;
    throw err;
  }
  const stats = await getParticipationStats(Number(electionId));
  return { electionId: Number(electionId), ...stats };
}

export async function getElectionResults(electionId) {
  if (!isChainConfigured()) {
    const err = new Error('Blockchain is not configured');
    err.status = 503;
    throw err;
  }
  try {
    const results = await getResultsFromChain(Number(electionId));
    return { electionId: Number(electionId), results };
  } catch (e) {
    if (e.reason?.includes('ResultsNotAvailable') || e.message?.includes('ResultsNotAvailable')) {
      const err = new Error('Results are not published yet');
      err.status = 403;
      err.code = 'RESULTS_NOT_PUBLISHED';
      throw err;
    }
    throw e;
  }
}
