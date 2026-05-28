# Electronic Voting System for Students Using Blockchain Technology

**Author:** George Geru  
**Institution:** Faculty of Engineering in Foreign Languages, National University of Science and Technology POLITEHNICA Bucharest  
**Document type:** Research paper writing plan (implementation-focused)

> **Coordinator requirements:** accent on implementation; **working code + PPT**; structure: Architecture, Design, Implementation, code snippets, screenshots — **title unchanged**.  
> **Step-by-step guide:** [`docs/THESIS_CONTINUATION_GUIDE.md`](docs/THESIS_CONTINUATION_GUIDE.md) (technologies from `Research_Geru_George.pdf`, defense checklist, PPT outline).

---

## How to use this document

Each section below lists **purpose**, **recommended length**, **outline**, **figures/tables**, and **writing notes**. Draft the final paper in academic English; expand bullets into connected paragraphs. Do not reproduce theoretical background already covered elsewhere—this paper centers on **system architecture, design decisions, and implementation** of the web application.

---

## Abstract *(max 10 rows)*

### Purpose
Summarize the problem, approach, main components, and outcomes in ≤10 lines (single-spaced) or ~150–200 words.

### Draft abstract (edit after implementation is complete)

> University student elections require trustworthy processes that resist tampering while remaining practical for large, mobile-first populations. This work presents a web-based electronic voting system that authenticates students through institutional identification, enforces one vote per eligible participant via smart contracts, and records vote commitments on a permissioned blockchain for integrity and auditability. The solution follows a hybrid architecture: eligibility verification and sensitive identity data remain off-chain, while cryptographic commitments and election state are stored on-chain. A React single-page application provides badge capture, ballot selection, and result viewing; a backend service integrates with the university registry and blockchain network. The prototype demonstrates that blockchain-backed organizational voting can meet core security requirements—eligibility, uniqueness, and vote integrity—without exposing plaintext ballots on the ledger. Evaluation with simulated elections reports transaction latency, authentication flow duration, and operational constraints for deployments at university scale.

### Checklist before finalizing
- [ ] State exact blockchain platform used (e.g. Hyperledger Fabric, private EVM)
- [ ] Name authentication method as implemented (OCR badge + optional liveness/selfie)
- [ ] Mention approximate voter scale tested (e.g. pilot N users)
- [ ] One sentence on limitations (e.g. trusted tally ceremony, coercion not fully addressed)

---

## Keywords *(5)*

Use exactly five keywords for indexing. Suggested set (adjust if journal/conference template differs):

1. **Electronic voting**
2. **Blockchain**
3. **Smart contracts**
4. **Student authentication**
5. **Web application**

*Alternatives if space allows substitution:* cryptographic commitment, permissioned ledger, university elections, immutability, hybrid architecture.

---

## Introduction

### Purpose
Motivate the problem, state objectives, delimit scope, and preview how the paper is organized (Architecture → Design → Implementation).

### Recommended length
1.5–2 pages (~800–1,000 words)

### Outline

#### 1. Context and motivation
- Role of student elections at university level (representation, governance, trust in outcomes).
- Limitations of paper ballots and centralized online polls: manual errors, opaque tallying, single points of failure, disputed results.
- Why blockchain is considered: append-only ledger, distributed verification, smart-contract enforcement of rules.
- UPB-specific constraint: students already hold institutional badges; leverage existing assets instead of costly NFC or national eID infrastructure.

#### 2. Problem statement
- Design and build a **web application** that allows an eligible student to:
  - authenticate once per election,
  - cast exactly one vote,
  - rely on an immutable on-chain record without publishing identifiable vote choices on the ledger.

#### 3. Objectives (numbered, measurable)
1. Define a hybrid architecture separating off-chain identity from on-chain vote commitments.
2. Specify authentication, ballot handling, and smart-contract interfaces.
3. Implement a production-oriented web client and integrate backend + blockchain services.
4. Validate the prototype against core requirements: eligibility, uniqueness (one person, one vote), vote integrity, and basic verifiability.

#### 4. Scope and assumptions
- **In scope:** organizational/university elections (thousands to tens of thousands of voters), permissioned chain, web + mobile browser access.
- **Out of scope or deferred:** full coercion-resistance, homomorphic tallying on-chain, national-scale deployment, formal cryptographic proofs.
- **Assumptions:** trusted university enrollment API; honest majority of permissioned validators; election organizers run post-election reveal/tally ceremony.

#### 5. Contributions of this paper
- End-to-end architecture for badge-based student e-voting with blockchain commitments.
- Concrete design of components, data flows, and on-chain/off-chain data partitioning.
- Implementation description of the web stack and integration points.
- Preliminary evaluation metrics and lessons learned.

#### 6. Paper structure
One short paragraph mapping sections: Architecture (what the system is), Design (how it is structured and why), Implementation (how it was built), References.

### Figures
- Optional: **Figure 1** — high-level stakeholder view (Student, Web App, Backend, University DB, Blockchain, Election Admin).

### Writing notes
- Open with the **application** and **university use case**, not a survey of e-voting history.
- Avoid duplicating long threat-model or classical e-voting taxonomy sections; cite foundational work briefly and point readers to standard references.

---

## Architecture

### Purpose
Describe the **logical and physical structure** of the system: layers, deployment nodes, trust boundaries, and architectural pattern choice (hybrid off-chain / on-chain).

### Recommended length
2–3 pages (~1,200–1,800 words) + 2–3 figures

### Outline

#### 1. Architectural style and rationale
- **Chosen pattern:** Hybrid model — off-chain authentication and vote preparation; on-chain storage of commitments and election lifecycle state.
- **Rejected alternatives (brief):**
  - Fully on-chain encrypted ballots: cost and throughput unsuitable for ~50k students.
  - Off-chain-only with final hash on-chain: weak individual verifiability.
- **Decision table** (Table 1): compare Fully on-chain / Hybrid / Off-chain finalization on cost, privacy, verifiability, UPB fit.

#### 2. Logical layers
| Layer | Responsibility | Trust |
|-------|----------------|-------|
| Presentation | Web UI: login, badge scan, ballot, status | User device |
| Application API | Sessions, orchestration, business rules | University-operated |
| Identity & eligibility | Badge OCR, enrollment check, voter token | University registry |
| Blockchain adapter | Submit transactions, read events | Network validators |
| Smart contracts | Voter registry (hashed IDs), hasVoted, commitments | Code + consensus |
| Post-election tally | Reveal mappings, aggregate, publish results | Election board |

#### 3. Component diagram (Figure 2)
Describe each box and arrow:
- **Web client** (browser): camera/OCR or QR, ballot UI, wallet/session handling.
- **Backend API**: JWT-secured REST; validates student; mints short-lived voting authorization; never stores plaintext vote with student ID in same record.
- **University student service** (external): active enrollment lookup.
- **Permissioned blockchain**: nodes operated by university or consortium; smart contract(s) for election instance.
- **Blockchain explorer / audit interface** (optional): read-only verification for students and auditors.

#### 4. Deployment view (Figure 3)
- Typical deployment: HTTPS-terminated reverse proxy, API containers, Fabric/EVM nodes, database for off-chain audit logs (non-vote secrets).
- Network zones: DMZ for web, internal for DB and chain peers.
- Environment variables and secrets (API keys, chain credentials) — mention without exposing values.

#### 5. Election lifecycle (state machine)
States: `Created` → `RegistrationOpen` → `VotingOpen` → `VotingClosed` → `Tallying` → `ResultsPublished`.  
Smart contract enforces transitions; only authorized admin roles trigger phase changes.

#### 6. Data placement principle
- **Off-chain:** badge images (transient), selfie frames (if used), student code before hashing, session tokens, application logs (minimized).
- **On-chain:** `SHA-256(studentIdentifier)`, commitment hash, election ID, timestamps, events (`VoteCommitted`, `AlreadyVoted`).
- **Never on-chain:** plaintext student name, raw badge photo, cleartext ballot linked to identity.

#### 7. Security architecture (cross-cutting)
- TLS for all client–server traffic.
- JWT or session cookie for authenticated API calls after initial badge verification.
- Rate limiting on authentication endpoints.
- Separation of duties: election admin vs. system admin vs. validator operators.

#### 8. Non-functional requirements mapping
- **Scalability:** horizontal API scaling; batching chain transactions if needed.
- **Availability:** redundant API; chain HA via multiple peers.
- **Usability:** responsive web UI, camera-based scan, minimal steps to vote.
- **Performance targets:** document targets (e.g. auth &lt; 5 s, chain confirmation &lt; 30 s on permissioned network).

### Tables and figures checklist
- [x] Table 1 — architecture comparison → **Table 4.1** in [`docs/thesis/ARCHITECTURE.md`](docs/thesis/ARCHITECTURE.md)
- [x] Figure 2 — component diagram → **Figure 4.2**
- [x] Figure 3 — deployment diagram → **Figure 4.3**
- [x] Figure 4 — election state machine → **Figure 4.4**

**Draft chapter (ready for Word):** [`docs/thesis/ARCHITECTURE.md`](docs/thesis/ARCHITECTURE.md)

---

## Design

### Purpose
Explain **detailed design decisions**: data models, protocols, smart contract logic, authentication flow, privacy mechanisms, and interfaces—sufficient for another developer to reproduce the system.

### Recommended length
3–4 pages (~2,000–2,500 words) + 2–3 figures

### Outline

#### 1. Design goals and constraints
- Prioritize: eligibility + uniqueness + integrity + practical cost.
- Trade-offs accepted: trusted tally/reveal step; simplified vote hiding via commitments rather than homomorphic encryption.

#### 2. Authentication and eligibility design

##### 2.1 Flow (Figure 5 — sequence diagram)
1. Student opens web app → navigates to election.
2. **Badge capture:** device camera captures UPB student badge; OCR extracts student code (e.g. pattern `J#####`).
3. **Optional liveness / visual match:** compare badge photo region with live selfie (design intent; document algorithm choice: manual review vs. automated similarity score).
4. **Enrollment verification:** backend calls university API; rejects if not active student.
5. **Voter binding:** compute `voterId = SHA-256(studentCode || electionId || salt)`; register or check slot on-chain.
6. **Session:** issue JWT with scoped claims (`electionId`, `voterIdHash`, `canVote: true`).

##### 2.2 Uniqueness enforcement
- On-chain mapping: `voterIdHash → hasVoted`.
- Backend refuses second submission for same hash; contract reverts duplicate transactions.

##### 2.3 Anti-abuse controls
- Rate limits per IP and per device fingerprint (design level).
- Short-lived voting tokens (single use).
- Audit log of authentication attempts without storing ballot choice.

#### 3. Ballot and commitment design

##### 3.1 Ballot model
- Election contains candidates/options with stable IDs.
- Student selects one option in UI; client sends choice to backend over TLS (not directly to chain in cleartext).

##### 3.2 Commitment scheme
- Define: `commitment = H(voterIdHash || choiceId || nonce || electionId)`.
- Store `commitment` on-chain; store `(choiceId, nonce)` encrypted off-chain or in sealed envelope until tally phase.
- Post-election: publish reveal data; anyone recomputes hash and verifies tally.

##### 3.3 Privacy properties (honest description)
- On-chain observers see commitments, not choices, before reveal.
- Limitation: backend sees choice at cast time unless client-side encryption is added—state this explicitly.

#### 4. Smart contract design

##### 4.1 Contract responsibilities
- `createElection(title, options, start, end)`
- `registerVoter(voterIdHash)` or preloaded Merkle root of eligible voters
- `castVote(commitment)` with `require(!hasVoted[voterIdHash])`
- `closeVoting()` / `publishResults(tallyHash)`

##### 4.2 Events (for explorers and client polling)
- `VoteCommitted(voterIdHash, commitment, blockTimestamp)`
- `VotingClosed(electionId)`

##### 4.3 Access control
- Roles: `ADMIN`, `ORACLE` (if backend submits on behalf of users), `READER`.
- Use OpenZeppelin-style `AccessControl` or Fabric chaincode endorsement policies—name the actual approach.

##### 4.4 Gas / resource model
- Estimate storage per voter (32-byte hash + flags); justify permissioned chain for fixed low cost.

#### 5. API design (REST)

| Method | Endpoint (example) | Description |
|--------|-------------------|-------------|
| POST | `/auth/badge` | OCR payload or student code + electionId |
| GET | `/elections/active` | List open elections |
| POST | `/votes` | Submit ballot; backend writes chain |
| GET | `/votes/status` | Has current user voted? |
| GET | `/elections/{id}/results` | Results after publish |

- OpenAPI-style request/response JSON schemas in an appendix or subsection.
- Error codes: `NOT_ELIGIBLE`, `ALREADY_VOTED`, `ELECTION_CLOSED`, `CHAIN_ERROR`.

#### 6. Web application design (UX)

##### 6.1 Main screens
1. Login / landing (if admin or returning session).
2. Election list.
3. Authenticate (camera / upload badge).
4. Ballot selection (candidates with confirmation step).
5. Confirmation receipt (commitment tx hash, link to explorer).
6. Results dashboard (post-election).

##### 6.2 Navigation and roles
- **Voter:** vote flow only.
- **Administrator:** create election, open/close phases, export tally (future or current scope).

##### 6.3 Responsive layout
- Mobile-first; Tailwind breakpoints; accessible contrast and large tap targets.

#### 7. Technology stack selection (design justification)

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Frontend | React 19 + TypeScript + Vite | Component model, typing, fast dev/build |
| Styling | Tailwind CSS | Consistent responsive UI |
| HTTP | Axios + interceptors | Centralized auth header and 401 handling |
| Server state | TanStack React Query | Cache elections, mutations for vote submit |
| Routing | React Router v7 | Protected routes for voter/admin |
| Camera / scan | Browser camera API + ZXing (or Tesseract.js for OCR) | No native app store dependency |
| Auth token | JWT in httpOnly cookie or secure cookie | SPA session with backend validation |
| Backend | Node.js + Express + ethers.js | University integration, chain SDK |
| Blockchain | Permissioned (Fabric / private Besu) | Cost, throughput, access control |

#### 8. Threat mitigation mapping (concise)
- Double voting → on-chain `hasVoted` + backend idempotency.
- Database tampering → hashes on chain; compare off-chain DB to chain events.
- MitM → TLS, cert pinning (mobile WebView if applicable).
- Ballot stuffing → enrollment API + hashed voter list.

### Figures checklist
- [ ] Figure 5 — authentication sequence diagram
- [ ] Figure 6 — vote commitment sequence diagram
- [ ] Table 2 — API summary
- [ ] Table 3 — on-chain vs off-chain data

---

## Implementation

### Purpose
Document **what was built**, repository structure, key modules, configuration, smart contract deployment, and integration—aligned with the `voting-system-upb` monorepo (`frontend/`, `backend/`, `contracts/`).

### Recommended length
3–4 pages (~2,000–2,500 words) + code snippets + screenshots

### Outline

#### 1. Implementation overview
- Monorepo layout: `frontend/` (React SPA), `backend/` (Node API), `contracts/` (Solidity), infrastructure scripts.
- Development environment: Node.js, package manager, local chain, API base URL via `VITE_API_BASE_URL`.

#### 2. Frontend implementation (`frontend/`)

##### 2.1 Project bootstrap
- **Stack:** Vite 7, React 19, TypeScript 5.7, ESLint, Prettier.
- **Entry:** `src/main.tsx` — `QueryClientProvider`, `BrowserRouter`, global context provider.
- **Routing:** `src/App.tsx` — protected routes via `AuthRoute`; public login/register.

##### 2.2 Modules to implement or refactor (map from current scaffold)
Current repository contains reusable infrastructure (auth, layout, QR scanner); **replace domain-specific bus/travel screens** with voting flows:

| Module | Path (existing / planned) | Implementation task |
|--------|---------------------------|---------------------|
| Auth & session | `frontend/src/context/auth.ts`, `Login.tsx`, `Registration.tsx` | Align login with voter/admin roles; JWT via `js-cookie` + `axiosConfig.ts` |
| HTTP client | `frontend/src/utils/axiosConfig.ts` | Point to voting API; interceptors for 401 |
| Protected routing | `frontend/src/components/Account/AuthRoute.tsx` | Guard `/elections`, `/vote/:id` |
| Badge / QR capture | `frontend/src/components/QRScanner.tsx` | Extend or add `BadgeScanner.tsx` with OCR pipeline |
| Election list | *new* `frontend/src/components/Elections/` | Fetch active elections (React Query) |
| Ballot UI | *new* `frontend/src/components/Vote/` | Candidate list, confirm, submit mutation |
| Receipt | *new* `frontend/src/components/Vote/Receipt.tsx` | Show tx hash, explorer link |
| Results | *new* `frontend/src/components/Results/` | Poll or websocket after close |
| Layout & nav | `frontend/src/Layout.tsx`, `Navigation.tsx` | UPB branding, role-based menu |
| Shared UI | `Input.tsx`, `Form.tsx`, `Select.tsx` | Reuse for forms |

##### 2.3 State management
- `useRequestWithAuth` hook for authenticated API calls.
- React Query keys: `['elections']`, `['election', id]`, `['voteStatus', electionId]`.
- Mutations: `useCastVoteMutation`, `useAuthenticateBadgeMutation`.

##### 2.4 Camera and identification
- `QRScanner.tsx`: ZXing `BrowserMultiFormatReader` for QR-based voter tokens or station codes.
- Planned: HTML5 `getUserMedia` + OCR (Tesseract.js or server-side OCR endpoint) for badge student code extraction per design.

##### 2.5 Build and quality
- Scripts: `npm run dev`, `build`, `lint`, `format`.
- Environment: `.env` with `VITE_API_BASE_URL`.
- Production build output in `dist/` for static hosting behind HTTPS.

#### 3. Backend implementation (describe actual stack when present)

##### 3.1 Services
- Authentication service: validate badge/student code, issue JWT.
- Voting service: validate election window, compute commitment, invoke chain adapter.
- Integration client for university enrollment API.

##### 3.2 Persistence
- Tables: `Elections`, `Candidates`, `AuthAuditLog`, `VoteEnvelopes` (encrypted choice + nonce), optional `ChainTxLog`.
- Migrations and seed data for demo elections.

##### 3.3 Blockchain integration layer
- SDK: Fabric Gateway / Web3.js / ethers (specify).
- Functions: `deployContract`, `castVoteCommitment`, `getHasVoted`, `listenEvents`.
- Retry and idempotency on failed transactions.

#### 4. Smart contract / chaincode implementation
- Language: Solidity or Go chaincode.
- File structure and key functions matching Design §4.
- Unit tests (Hardhat / Fabric test network).
- Deployment script: network config, channel, endorsement policy.

#### 5. End-to-end vote casting path (implementation walkthrough)
Numbered steps with component names:
1. User authenticates → JWT stored.
2. `POST /votes` with `electionId`, `choiceId`.
3. Backend computes commitment, submits transaction.
4. Frontend polls tx receipt → displays confirmation.
5. Explorer URL constructed from config.

#### 6. Configuration and deployment
- Docker Compose (optional): API + DB + peer + frontend nginx.
- CI: lint and build on push.
- Secrets management for production.

#### 7. Testing performed
- **Unit:** commitment hash, contract revert on double vote.
- **Integration:** API + local chain.
- **Manual / UAT:** N test students, one election, measure timings.
- Record results in a table (Section 7.8 or short subsection).

| Test case | Expected | Result |
|-----------|----------|--------|
| Eligible student votes once | Success + event | |
| Same student votes again | Rejected | |
| Ineligible ID | 403 NOT_ELIGIBLE | |
| Vote after close | ELECTION_CLOSED | |

#### 8. Known limitations and technical debt
- Scaffold routes still reference legacy domains until refactored.
- Client-side OCR accuracy depends on lighting; fallback manual code entry.
- Backend sees ballot before commitment unless client-side encryption added later.

#### 9. Screenshots for the paper
- [ ] Login / home
- [ ] Badge capture screen
- [ ] Ballot selection
- [ ] Success receipt with transaction ID
- [ ] Results page
- [ ] Block explorer showing commitment

### Code excerpt policy
Include 10–20 line snippets only: e.g. commitment hash function, smart contract `castVote`, Axios interceptor—refer to repository paths in captions.

---

## References

### Purpose
List all cited works in consistent format (IEEE or APA—match faculty template). Every in-text citation must appear here.

### Target count
25–40 references for a dissertation chapter; 15–25 for a shorter research article.

### Categories to cover

#### Electronic voting and requirements
- Academic surveys on e-voting security properties (eligibility, uniqueness, verifiability).
- Organizational/campus e-voting case studies.

#### Blockchain and distributed ledgers
- Nakamoto (Bitcoin) or foundational DLT text—for immutability and decentralization context (one citation sufficient).
- Ethereum yellow paper or Hyperledger Fabric documentation—for platform actually used.
- Papers on blockchain-based voting architectures (hybrid, on-chain, off-chain).

#### Cryptography
- Commitment schemes (Pedersen or standard hash commitments).
- Optional: Paillier homomorphic encryption, zero-knowledge proofs—only if discussed in Design.

#### Authentication and identity
- NFC/smartcard student ID literature.
- OCR and document capture for ID verification (if badge OCR is claimed).

#### Web engineering
- React / SPA security (OWASP ASVS, JWT best practices).
- REST API design references as needed.

### Starter bibliography (expand and format per template)

1. Benaloh, J., & Tuinstra, D. (1994). Receipt-free secret-ballot elections. *ACM STOC*.
2. Chaum, D. (1981). Untraceable electronic mail, return addresses, and digital pseudonyms. *Communications of the ACM*.
3. Adida, B. (2008). Helios: Web-based open-audit voting. *USENIX Security*.
4. Hardwick, F., et al. (2018). A taxonomy of blockchain-based voting systems. *IEEE Access* (or equivalent survey—verify).
5. Hyperledger Foundation. *Hyperledger Fabric Documentation*. https://hyperledger-fabric.readthedocs.io/
6. Wood, G. (2014). Ethereum: A secure decentralised generalised transaction ledger (Yellow Paper).
7. OpenZeppelin. *Contracts: AccessControl*. https://docs.openzeppelin.com/contracts/
8. OWASP Foundation. *Application Security Verification Standard*.
9. IETF RFC 7519 — JSON Web Token (JWT).
10. ScienceDirect topic: Electronic voting system. https://www.sciencedirect.com/topics/computer-science/electronic-voting-system
11. Add: UPB internal regulations on student elections (if citable).
12. Add: Estonian i-voting security analyses, Indian EVM studies—only if briefly compared in Introduction.
13. Add: Recent university blockchain voting pilots (ETH Zurich, etc.) from literature review.

### Reference management
- Use Zotero or Mendeley; export IEEE style.
- Mark placeholders with `TODO` until PDFs are read.
- Include access dates for online documentation.

---

## Writing schedule (suggested)

| Week | Deliverable |
|------|-------------|
| 1 | Finalize Architecture diagrams; draft Architecture section |
| 2 | Complete Design (sequence diagrams, API table, contract spec) |
| 3 | Implement remaining frontend flows; deploy test network |
| 4 | Draft Implementation + collect screenshots and metrics |
| 5 | Write Introduction and Abstract; unify terminology |
| 6 | Complete References; proofread; advisor review |

---

## Consistency checklist (full paper)

- [ ] Same election terminology throughout (`election`, `ballot`, `commitment`, `voterIdHash`).
- [ ] Architecture (Hybrid) matches Design and Implementation.
- [ ] Every figure numbered and referenced in text.
- [ ] No plaintext votes on-chain claim holds in Implementation.
- [ ] Abstract ≤ 10 rows; exactly 5 keywords.
- [ ] All sections present: Abstract, Keywords, Introduction, Architecture, Design, Implementation, References.

---

## Appendix ideas (optional, not in required structure)

- **Appendix A:** Full OpenAPI specification  
- **Appendix B:** Smart contract source listing  
- **Appendix C:** User manual (student voting steps)  
- **Appendix D:** Raw benchmark tables  

---

*End of research paper plan*
