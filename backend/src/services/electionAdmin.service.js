import {
  addCandidate,
  closeVoting,
  createElection,
  getElectionFromChain,
  listElectionIds,
  openVoting,
  publishResultsOnChain,
} from '../blockchain/blockchainClient.js';

const STATE_LABELS = ['Created', 'VotingOpen', 'VotingClosed', 'ResultsPublished'];
const FACULTY_SCOPE_REGEX = /\s*\[FACULTY:([A-Za-z0-9_-]+)\]\s*$/;

export function attachFacultyScopeToTitle(title, faculty) {
  const cleanTitle = String(title || '').trim();
  const cleanFaculty = String(faculty || '').trim().toUpperCase();
  if (!cleanFaculty || cleanFaculty === 'ALL') {
    return cleanTitle;
  }
  return `${cleanTitle} (Only for ${cleanFaculty})`;
}

export function extractFacultyScopeFromTitle(title) {
  const match = String(title || '').match(FACULTY_SCOPE_REGEX);
  if (!match) {
    return null;
  }
  return match[1].toUpperCase();
}

/**
 * Organizer operations: election pool lifecycle only — no ballot or tally access.
 */
export async function organizerCreateElection({ title, startTime, endTime, candidates = [] }) {
  const { electionId, txHash } = await createElection(title, startTime, endTime);

  for (const name of candidates) {
    await addCandidate(electionId, name);
  }

  return { electionId, txHash };
}

export async function organizerOpenVoting(electionId) {
  return openVoting(Number(electionId));
}

export async function organizerCloseVoting(electionId) {
  return closeVoting(Number(electionId));
}

/** Makes on-chain counts publicly readable; does not modify vote numbers. */
export async function organizerPublishResults(electionId) {
  return publishResultsOnChain(Number(electionId));
}

export async function listElections() {
  const ids = await listElectionIds();
  const elections = await Promise.all(ids.map((id) => getElectionFromChain(id)));
  return elections.map((e) => ({
    ...e,
    stateLabel: STATE_LABELS[e.state] ?? 'Unknown',
    votingOpen: e.state === 1,
    resultsVisible: e.state === 3,
  }));
}

export async function getElectionDetail(electionId) {
  const election = await getElectionFromChain(Number(electionId));
  return {
    ...election,
    stateLabel: STATE_LABELS[election.state] ?? 'Unknown',
    votingOpen: election.state === 1,
    resultsVisible: election.state === 3,
  };
}

// Legacy aliases for routes
export const adminCreateElection = organizerCreateElection;
export const adminOpenVoting = organizerOpenVoting;
export const adminCloseVoting = organizerCloseVoting;
export const adminPublishResults = organizerPublishResults;
