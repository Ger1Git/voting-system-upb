# Trust model: no one controls votes; organizer only creates the pool

## Roles (what each party can do)

| Role | Can do | Cannot do |
|------|--------|-----------|
| **Student** | Vote (commitment), verify receipt, **reveal own ballot** after close | See others’ choices or live totals |
| **Organizer** | Create election, add candidates, open/close voting, **publish** results flag | Read ballots, submit reveals, change counts, bulk tally |
| **Oracle (backend)** | Relay `castVote` and `revealVote` txs from authenticated students | Forge commitments; change recorded commitments |
| **Public** | See commitments during vote; see totals **only after** `publishResults` | See choices during voting |

There is **no admin with access to all votes**. The database (if used) stores **organizer login** and **audit logs only** — not a central ballot table.

## Lifecycle

1. **Voting open** — student sends `commitment` (best: computed in browser). Chain stores hash only.  
2. **Voting closed** — organizer closes pool; still **no public counts**.  
3. **Reveal window** — each student `POST /api/votes/reveal` with `candidateId` + `nonce` (from `localStorage`). Contract checks hash and adds **one** to tally.  
4. **Publish** — organizer calls `publishResults` → only then `getResults()` works. Organizer does not pass vote data.

## Student storage (browser)

```text
localStorage: { electionId, candidateId, nonce, commitment }
```

Backend must **not** persist `nonce` or `candidateId` after the vote request ends.

## Why blockchain

- **Uniqueness:** `hasVoted` on chain.  
- **Integrity:** commitment cannot be changed after mining.  
- **Correct count:** only valid reveals increment `voteCounts`.  
- **No central ballot DB** for organizer to edit.

## Remaining trust (state honestly in thesis)

- **Oracle** could censor a tx but cannot forge another student’s commitment without their nonce.  
- **TLS to API:** use client-side commitment so server never logs choice.  
- **Reveal:** student must participate in reveal phase (or votes stay committed but uncounted).
