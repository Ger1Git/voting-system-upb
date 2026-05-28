# System Architecture — UPB Blockchain Voting Application

This document defines how the **web frontend**, **backend API**, and **permissioned blockchain** work together. The backend does not implement voting rules in application code alone: **creating elections, accepting votes, enforcing one vote per student, and tallying results are enforced by smart contracts**. The backend authenticates students, derives pseudonymous voter identifiers, and submits signed transactions to the chain.

---

## 1. Architectural goals

| Goal | Owner |
|------|--------|
| Only eligible UPB students vote | Backend + university enrollment API |
| **One student → one vote** per election | **Smart contract** (`hasVoted` mapping) |
| **Vote creation** (recording a ballot) | **Smart contract** (`castVote`) |
| **Vote counting** (per-candidate totals) | **Smart contract** (`voteCounts` + `getResults`) |
| Election lifecycle (open / close) | **Smart contract** (state machine) |
| Student identity privacy on ledger | Backend hashes student code before any chain call |

---

## 2. High-level view

```mermaid
flowchart TB
    subgraph Client["Presentation tier"]
        WEB["React SPA<br/>badge scan, ballot, results"]
    end

    subgraph Backend["Application tier (university-operated)"]
        API["REST API"]
        AUTH["Auth & eligibility service"]
        VOTE["Voting orchestration service"]
        CHAIN_ADAPT["Blockchain adapter<br/>ethers / Fabric SDK"]
        DB[(PostgreSQL<br/>admin users, audit,\nsealed ballots, tx log)]
    end

    subgraph External["External systems"]
        UPB["UPB student registry API"]
    end

    subgraph Ledger["Blockchain tier (source of truth for votes)"]
        SC["VotingElection smart contract"]
        NODES["Permissioned validators"]
    end

    WEB -->|HTTPS + JWT| API
    API --> AUTH
    API --> VOTE
    AUTH --> UPB
    AUTH --> DB
    VOTE --> CHAIN_ADAPT
    VOTE --> DB
    CHAIN_ADAPT -->|signed transactions| SC
    SC --> NODES
    WEB -.->|optional: read-only explorer| NODES
```

**Rule:** If backend and chain disagree on whether a student voted, **the chain wins**. The API checks chain state before accepting a new ballot.

---

## 3. Responsibility split

### 3.1 Frontend (React)

- Capture badge (camera / OCR) or manual student code entry.
- Display elections, candidates, confirmation, receipt (transaction hash).
- Call backend REST only — **students do not hold crypto wallets** in the MVP.
- Show results by reading `GET /elections/{id}/results` (backend reads from chain).

### 3.2 Backend (orchestrator, not vote authority)

| Module | Responsibility |
|--------|----------------|
| **Auth** | OCR/badge validation, UPB enrollment check, issue JWT |
| **Voter ID** | `voterHash = SHA-256(studentCode ‖ electionId ‖ domainSalt)` — never send raw student code to chain |
| **Voting** | Validate JWT + election window; call contract `castVote`; handle retries |
| **Election admin** | Call `createElection`, `openVoting`, `closeVoting` (admin role) |
| **Blockchain adapter** | Wallet managed by university; gas/fees on permissioned network |
| **DB** | Sessions, auth audit, optional encrypted ballot backup — **not** primary vote ledger |

### 3.3 Blockchain (business logic for votes)

| Function | Purpose |
|----------|---------|
| `createElection` | Register election metadata and candidates on-chain |
| `openVoting` / `closeVoting` | Enforce time/state gates |
| `castVote` | Record ballot, set `hasVoted`, increment `voteCounts` |
| `hasVoted` | Query for duplicate prevention |
| `getResults` | Return per-candidate totals after voting closes |

See [`contracts/VotingElection.sol`](../contracts/VotingElection.sol) for the canonical interface.

---

## 4. Core flows

### 4.1 Student authentication (off-chain)

```mermaid
sequenceDiagram
    participant S as Student browser
    participant API as Backend API
    participant UPB as UPB registry
    participant DB as Off-chain DB

    S->>API: POST /auth/badge { studentCode, electionId }
    API->>UPB: Verify active enrollment
    UPB-->>API: enrolled / not enrolled
    alt not eligible
        API-->>S: 403 NOT_ELIGIBLE
    end
    API->>API: voterHash = SHA256(studentCode, electionId, salt)
    API->>DB: Log auth attempt (no ballot)
    API-->>S: JWT { electionId, voterHash, role: Voter }
```

### 4.2 Cast vote (backend → blockchain)

```mermaid
sequenceDiagram
    participant S as Student browser
    participant API as Backend API
    participant SC as VotingElection contract

    S->>API: POST /votes { electionId, candidateId } + JWT
    API->>API: Validate JWT, electionId match
    API->>SC: hasVoted(electionId, voterHash)
    SC-->>API: false
    API->>SC: castVote(electionId, voterHash, candidateId)
    alt already voted
        SC-->>API: revert AlreadyVoted
        API-->>S: 409 ALREADY_VOTED
    end
    SC-->>API: tx receipt + VoteCast event
    API-->>S: 201 { txHash, blockNumber }
```

**Single-vote guarantee:** `castVote` uses `require(!hasVoted[electionId][voterHash])` then sets `hasVoted = true` before incrementing counts. Replayed API requests hit the same on-chain guard.

### 4.3 Create election (admin)

```mermaid
sequenceDiagram
    participant A as Admin UI
    participant API as Backend API
    participant SC as VotingElection contract

    A->>API: POST /admin/elections { title, candidates[], start, end }
    API->>SC: createElection(...)
    SC-->>API: electionId
    API-->>A: 201 { electionId, txHash }
    Note over API,SC: Later: openVoting(electionId), closeVoting(electionId)
```

### 4.4 Count votes (on-chain)

```mermaid
sequenceDiagram
    participant A as Admin / public
    participant API as Backend API
    participant SC as VotingElection contract

    A->>API: GET /elections/{id}/results
    API->>SC: getResults(electionId)
    Note over SC: Requires state VotingClosed or ResultsPublished
    SC-->>API: candidateIds[], voteCounts[]
    API-->>A: JSON results
```

Tallying is **reading aggregated counters** maintained during each `castVote` — no separate mutable database tally for production truth.

---

## 5. Election state machine (on-chain)

```mermaid
stateDiagram-v2
    [*] --> Created: createElection
    Created --> VotingOpen: openVoting
    VotingOpen --> VotingClosed: closeVoting
    VotingClosed --> ResultsPublished: publishResults
    ResultsPublished --> [*]

    note right of VotingOpen
        castVote allowed only here
    end note
```

| State | `castVote` | `getResults` |
|-------|------------|--------------|
| Created | ❌ | ❌ |
| VotingOpen | ✅ | ❌ |
| VotingClosed | ❌ | ✅ (internal totals) |
| ResultsPublished | ❌ | ✅ (public) |

---

## 6. Data model

### 6.1 On-chain (smart contract storage)

```
Election {
  id, title, state, startTime, endTime
  candidates[]: { id, nameHash or short label }
}

mapping(electionId => mapping(voterHash => bool)) hasVoted
mapping(electionId => mapping(candidateId => uint256)) voteCounts
```

- **`voterHash`**: 32-byte pseudonym; unlinkable to name on ledger without off-chain salt leak.
- **`voteCounts`**: updated atomically inside `castVote` — this is the **official count**.

### 6.2 Off-chain (PostgreSQL application database)

The database **belongs in architecture diagrams** — it supports login and operations, not the authoritative vote ledger.

| Table / record | Stores | Does not store |
|----------------|--------|----------------|
| `AdminUser` | email, password hash, role | — |
| `AuthAudit` | timestamp, electionId, voterHash, success | ballot choice in audit row |
| — | **No ballot table** — secrets in student browser | — |
| `ChainTxLog` | txHash, electionId, voterHash, status | official vote totals |
| `Student` (optional) | rarely needed; badge auth uses UPB API + JWT | per-election vote state (use chain) |

**Students** typically do not have DB accounts; **admins** do. **Never** store ballot choices in DB. Tally via on-chain `revealVote` per student.

*See* [`PRIVATE_VOTING.md`](PRIVATE_VOTING.md).

---

## 7. Backend project structure (Node.js / JavaScript)

```
backend/
├── package.json
├── .env                        # RpcUrl, contract, oracle key, JWT
└── src/
    ├── index.js                # HTTP server (port 5122)
    ├── app.js                  # Express + /api routes
    ├── config.js
    ├── blockchain/
    │   ├── blockchainClient.js # ethers.js → VotingElection.sol
    │   └── VotingElection.abi.json
    ├── services/
    │   ├── auth.service.js     # Badge + UPB API + JWT
    │   ├── voterId.service.js  # SHA-256 voter hash
    │   ├── voting.service.js   # castVote, status, results
    │   └── electionAdmin.service.js
    ├── routes/                 # auth, votes, elections, admin
    └── middleware/             # JWT guards, errors
```

Stack: **Node.js 18+**, **Express**, **ethers v6**. The frontend uses `VITE_API_BASE_URL=http://localhost:5122/api`. See [`backend/README.md`](../backend/README.md).

---

## 8. REST API contract (backend surface)

Base URL: `/api` (matches `VITE_API_BASE_URL`).

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/badge` | Body: `{ studentCode, electionId }` → JWT |

### Elections (read)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/elections` | List elections (metadata from DB + chain state) |
| `GET` | `/elections/{id}` | Detail + `votingOpen` flag from chain |
| `GET` | `/elections/{id}/results` | Proxies `getResults` after close |

### Votes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/votes/status?electionId=` | Calls `hasVoted` on chain |
| `POST` | `/votes` | Body: `{ electionId, candidateId }` → `castVote` tx |

### Admin

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/admin/elections` | `createElection` |
| `POST` | `/admin/elections/{id}/open` | `openVoting` |
| `POST` | `/admin/elections/{id}/close` | `closeVoting` |

---

## 9. Blockchain adapter (backend ↔ contract)

The adapter holds one **oracle wallet** (university-operated) that submits transactions on behalf of authenticated students.

```text
// voting.service.js → castVote()
1. Assert JWT voterHash matches body electionId
2. If await getHasVoted(electionId, voterHash) → 409 ALREADY_VOTED
3. tx = await contract.castVote(electionId, voterHash, candidateId)  // onlyOracle
4. await tx.wait()
5. Return { txHash, blockNumber }
```

Configuration:

| Variable | Example |
|----------|---------|
| `BLOCKCHAIN_RPC_URL` | `http://localhost:8545` |
| `VOTING_CONTRACT_ADDRESS` | `0x…` |
| `ORACLE_PRIVATE_KEY` | stored in vault / user-secrets |
| `VOTER_ID_SALT` | application-wide salt for hashing |

---

## 10. Deployment topology

```mermaid
flowchart LR
    subgraph DMZ
        NGINX["Nginx / TLS"]
        SPA["Static React build (frontend/dist)"]
    end

    subgraph AppSubnet
        API1["Backend API"]
        API2["Backend API replica"]
    end

    subgraph DataSubnet
        PG[(PostgreSQL)]
        BC1["Blockchain peer 1"]
        BC2["Blockchain peer 2"]
    end

    Internet --> NGINX
    NGINX --> SPA
    NGINX --> API1
    NGINX --> API2
    API1 --> PG
    API1 --> BC1
    API2 --> PG
    API2 --> BC2
    BC1 --- BC2
```

- **Permissioned network** (Hyperledger Besu, Quorum, or private Ganache for dev): low fees, controlled validators, suitable for ~50k students.
- **Development:** Hardhat node + deployed `VotingElection` + backend pointing to local RPC.

---

## 11. Security properties mapped to components

| Requirement | Mechanism |
|-------------|-----------|
| Eligibility | UPB API + JWT only after verification |
| **One vote per student** | **`hasVoted` on chain** + API pre-check |
| **Integrity of count** | **`voteCounts` only mutated in `castVote`** |
| Immutability | Blockchain append-only ledger |
| Authentication | Badge/OCR + TLS + JWT |
| Admin actions | `onlyRole(ADMIN)` on contract + API admin role |

**Limitation (document in thesis):** `candidateId` in the transaction calldata is visible to node operators unless you move to commitment-based voting with an off-chain reveal phase. The architecture supports upgrading to commitments later without changing the frontend API shape.

---

## 12. Frontend integration map

| Planned UI | API | Chain effect |
|------------|-----|--------------|
| Badge scan page | `POST /auth/badge` | none |
| Election list | `GET /elections` | read state |
| Ballot page | `POST /votes` | `castVote` |
| “Already voted” | `GET /votes/status` | `hasVoted` |
| Results page | `GET /elections/{id}/results` | `getResults` |
| Admin console | `/admin/elections/*` | `createElection`, `openVoting`, `closeVoting` |

Reuse existing modules under `frontend/src/`: `axiosConfig.ts`, `AuthRoute.tsx`, `QRScanner.tsx` (badge/token), React Query for mutations.

---

## 13. Implementation order

1. Deploy `VotingElection.sol` to local chain; unit-test `castVote` revert on double vote.
2. Scaffold backend with `IBlockchainClient` and three endpoints: `POST /votes`, `GET /votes/status`, `GET /elections/{id}/results`.
3. Wire `POST /auth/badge` + voter hashing.
4. Replace legacy bus routes in React with election/vote screens.
5. Add admin election management.
6. Load-test: N parallel votes; verify `voteCounts` matches N unique `voterHash` values.

---

## Related files

- Smart contract: [`contracts/VotingElection.sol`](../contracts/VotingElection.sol)
- Research writing plan: [`research-paper-plan.md`](../research-paper-plan.md)
