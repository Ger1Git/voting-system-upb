# Smart contracts

`VotingElection.sol` — trust-minimized voting:

| Phase | On-chain | Who |
|-------|----------|-----|
| Setup | `createElection`, `addCandidate` | **Organizer** |
| Voting | `castVote(voterHash, commitment)` | **Oracle** (student request) |
| After close | `revealVote(voterHash, candidateId, nonce)` | **Oracle** (each student) |
| Publish | `publishResults` | **Organizer** (read-only unlock) |

Organizer **cannot** `revealVote` for others or set vote counts.

See [`docs/PRIVATE_VOTING.md`](../docs/PRIVATE_VOTING.md).
