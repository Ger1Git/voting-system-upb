import { ethers } from 'ethers';
import { config } from '../config.js';
import VotingElectionAbi from './VotingElection.abi.json' with { type: 'json' };

let provider;
let contract;
let oracleWallet;
let writeQueue = Promise.resolve();

function assertConfigured() {
  if (!config.contractAddress) {
    throw new Error('VOTING_CONTRACT_ADDRESS is not set');
  }
  if (!config.oraclePrivateKey) {
    throw new Error('ORACLE_PRIVATE_KEY is not set');
  }
}

export function getBlockchainClient() {
  if (!contract) {
    assertConfigured();
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    oracleWallet = new ethers.Wallet(config.oraclePrivateKey, provider);
    contract = new ethers.Contract(config.contractAddress, VotingElectionAbi, oracleWallet);
  }
  return { provider, contract, oracleWallet };
}

async function enqueueWrite(action) {
  const run = writeQueue.then(action);
  // Keep queue alive even when one action fails.
  writeQueue = run.catch(() => {});
  return run;
}

async function sendWriteTx(buildTx) {
  const { provider, oracleWallet } = getBlockchainClient();
  const isNonceError = (e) =>
    e?.code === 'NONCE_EXPIRED' ||
    e?.shortMessage?.includes('nonce has already been used') ||
    e?.info?.error?.message?.toLowerCase?.().includes('nonce too low');

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const [pendingNonce, latestNonce] = await Promise.all([
        provider.getTransactionCount(oracleWallet.address, 'pending'),
        provider.getTransactionCount(oracleWallet.address, 'latest'),
      ]);
      const nonce = Math.max(pendingNonce, latestNonce);
      const tx = await buildTx(nonce);
      return await tx.wait();
    } catch (e) {
      if (!isNonceError(e) || attempt === 3) {
        throw e;
      }
      // Give automine provider a brief moment before re-reading nonce.
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}

export async function createElection(title, startTime, endTime) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((nonce) =>
      contract.createElection(title, startTime, endTime, { nonce })
    );
    const electionId = await contract.electionCount();
    return { electionId: Number(electionId), txHash: receipt.hash };
  });
}

export async function addCandidate(electionId, name) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((nonce) =>
      contract.addCandidate(electionId, name, { nonce })
    );
    return { txHash: receipt.hash };
  });
}

export async function openVoting(electionId) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((nonce) =>
      contract.openVoting(electionId, { nonce })
    );
    return { txHash: receipt.hash };
  });
}

export async function closeVoting(electionId) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((nonce) =>
      contract.closeVoting(electionId, { nonce })
    );
    return { txHash: receipt.hash };
  });
}

export async function publishResultsOnChain(electionId) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((nonce) =>
      contract.publishResults(electionId, { nonce })
    );
    return { txHash: receipt.hash };
  });
}

export async function getHasVoted(electionId, voterHash) {
  const { contract } = getBlockchainClient();
  return contract.hasVoted(electionId, voterHash);
}

export async function getHasRevealed(electionId, voterHash) {
  const { contract } = getBlockchainClient();
  return contract.hasRevealed(electionId, voterHash);
}

export async function getVoteCommitmentOnChain(electionId, voterHash) {
  const { contract } = getBlockchainClient();
  return contract.voteCommitment(electionId, voterHash);
}

export async function getParticipationStats(electionId) {
  const { contract } = getBlockchainClient();
  const e = await contract.elections(electionId);
  return { committed: Number(e.votesCommitted), revealed: Number(e.votesRevealed) };
}

export async function castCommitmentOnChain(electionId, voterHash, commitment) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((nonce) =>
      contract.castVote(electionId, voterHash, commitment, { nonce })
    );
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
}

export async function revealVoteOnChain(electionId, voterHash, candidateId, nonce) {
  return enqueueWrite(async () => {
    const { contract } = getBlockchainClient();
    const receipt = await sendWriteTx((txNonce) =>
      contract.revealVote(electionId, voterHash, candidateId, nonce, { nonce: txNonce })
    );
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
}

export async function getResultsFromChain(electionId) {
  const { contract } = getBlockchainClient();
  const [candidateIds, counts, names] = await contract.getResults(electionId);
  return candidateIds.map((id, i) => ({
    candidateId: Number(id),
    name: names[i],
    votes: Number(counts[i]),
  }));
}

export async function getElectionFromChain(electionId) {
  const { contract } = getBlockchainClient();
  const e = await contract.elections(electionId);
  const candidateCount = Number(e.candidateCount);
  const candidates = [];
  for (let i = 1; i <= candidateCount; i += 1) {
    const c = await contract.candidates(electionId, i);
    candidates.push({
      id: Number(c.id),
      name: c.name,
    });
  }
  return {
    id: Number(e.id),
    title: e.title,
    state: Number(e.state),
    startTime: Number(e.startTime),
    endTime: Number(e.endTime),
    candidateCount,
    candidates,
    votesCommitted: Number(e.votesCommitted),
    votesRevealed: Number(e.votesRevealed),
  };
}

export async function listElectionIds() {
  const { contract } = getBlockchainClient();
  const count = Number(await contract.electionCount());
  const ids = [];
  for (let i = 1; i <= count; i++) {
    ids.push(i);
  }
  return ids;
}

export function isChainConfigured() {
  return Boolean(config.contractAddress && config.oraclePrivateKey);
}
