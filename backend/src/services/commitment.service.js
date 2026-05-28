import { randomBytes } from 'node:crypto';
import { ethers } from 'ethers';
import { voterHashToBytes32 } from './voterId.service.js';

/**
 * Must match VotingElection._computeCommitment (abi.encodePacked).
 */
export function computeVoteCommitment(voterHashHex, candidateId, nonceHex, electionId) {
  const voterHash = voterHashToBytes32(voterHashHex);
  const nonce = voterHashToBytes32(nonceHex);
  return ethers.solidityPackedKeccak256(
    ['bytes32', 'uint256', 'bytes32', 'uint256'],
    [voterHash, BigInt(candidateId), nonce, BigInt(electionId)]
  );
}

export function generateNonce() {
  return randomBytes(32).toString('hex');
}
