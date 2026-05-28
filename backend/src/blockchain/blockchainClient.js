import { ethers } from 'ethers';
import { config } from '../config.js';
import VotingElectionAbi from './VotingElection.abi.json' with { type: 'json' };

let provider;
let contract;
let oracleWallet;

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

export async function createElection(title, startTime, endTime) {
  const { contract } = getBlockchainClient();
  const tx = await contract.createElection(title, startTime, endTime);
  const receipt = await tx.wait();
  const electionId = await contract.electionCount();
  return { electionId: Number(electionId), txHash: receipt.hash };
}

export async function addCandidate(electionId, name) {
  const { contract } = getBlockchainClient();
  const tx = await contract.addCandidate(electionId, name);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function openVoting(electionId) {
  const { contract } = getBlockchainClient();
  const tx = await contract.openVoting(electionId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function closeVoting(electionId) {
  const { contract } = getBlockchainClient();
  const tx = await contract.closeVoting(electionId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function publishResultsOnChain(electionId) {
  const { contract } = getBlockchainClient();
  const tx = await contract.publishResults(electionId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function getHasVoted(electionId, voterHash) {
  const { contract } = getBlockchainClient();
  return contract.getHasVoted(electionId, voterHash);
}

export async function getHasRevealed(electionId, voterHash) {
  const { contract } = getBlockchainClient();
  return contract.getHasRevealed(electionId, voterHash);
}

export async function getVoteCommitmentOnChain(electionId, voterHash) {
  const { contract } = getBlockchainClient();
  return contract.getVoteCommitment(electionId, voterHash);
}

export async function getParticipationStats(electionId) {
  const { contract } = getBlockchainClient();
  const [committed, revealed] = await contract.getParticipationStats(electionId);
  return { committed: Number(committed), revealed: Number(revealed) };
}

export async function castCommitmentOnChain(electionId, voterHash, commitment) {
  const { contract } = getBlockchainClient();
  const tx = await contract.castVote(electionId, voterHash, commitment);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

export async function revealVoteOnChain(electionId, voterHash, candidateId, nonce) {
  const { contract } = getBlockchainClient();
  const tx = await contract.revealVote(electionId, voterHash, candidateId, nonce);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
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
  return {
    id: Number(e.id),
    title: e.title,
    state: Number(e.state),
    startTime: Number(e.startTime),
    endTime: Number(e.endTime),
    candidateCount: Number(e.candidateCount),
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
