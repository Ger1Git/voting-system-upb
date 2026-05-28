# Continuation Guide — Implementation-Focused Thesis & Defense

**Title (unchanged):** *Electronic Voting System For Students Using Blockchain Technology*  
**Student:** George Geru · FILS, POLITEHNICA Bucharest  
**Coordinator guidance (summary):** accent on **implementation**; **working code** + **PPT**; structure centered on **Architecture → Design → Implementation** with **code snippets** and **screenshots** — not a long theoretical survey like the first document.

---

## 1. What changes vs. your first PDF (`Research_Geru_George.pdf`)

| First document (background) | Second document / defense (what you write now) |
|----------------------------|-----------------------------------------------|
| Chapters 1–2: e-voting security, threat models, blockchain theory | **Keep 1–2 pages max** in Introduction only; cite the first work or literature |
| 4-chapter plan (theory → literature → design → evaluation) | **New structure below** — same **title**, different body |
| Describes OCR, selfie, UPB API, hybrid chain | **Must show these in code, screenshots, and demo** |
| Tables comparing NFC/passwords/biometrics | **One short table** in Design (why badge + OCR) — then move to your app |

**Do not** copy-paste Chapter 1/2 from the PDF into the new paper. Refer to them: *“Security requirements and threat models are established in prior work; this document focuses on architecture, design, and implementation of the prototype.”*

---

## 2. Required document structure (for Word/PDF thesis part 2)

Use this order (matches coordinator + your `research-paper-plan.md`):

1. **Abstract** (max 10 lines)  
2. **Keywords** (exactly 5)  
3. **Introduction** (~2 pages)  
4. **Architecture** (~3 pages + figures)  
5. **Design** (~4 pages + diagrams)  
6. **Implementation** (~5 pages + **code snippets** + **screenshots**)  
7. **References**  

Optional short closing subsection at end of Implementation or as **2.7 Evaluation (pilot)** (~1–2 pages): test scenario, double-vote test, tx latency table — no new chapter title required if faculty wants only the list above.

---

## 3. Technologies — from your PDF → what you must state → what the repo uses

Align the paper with **both** the PDF promises and the **actual stack** (update prose if something is still “planned”).

| Topic | From your PDF / introduction | Implemented in repo | Paper status |
|-------|------------------------------|---------------------|--------------|
| **Client** | Web app, badge scan, ballot UI | `frontend/` — React 19, TypeScript, Vite, Tailwind | ✅ State in Implementation |
| **Auth** | OCR on UPB badge → student code; optional selfie match | QR/camera (`QRScanner.tsx`); badge OCR route on API — **extend UI for OCR/selfie** | ⚠️ Describe API flow now; mark selfie/OCR UI as pilot if not finished |
| **Eligibility** | UPB database API | `auth.service.js` + `MOCK_UPB_ENROLLMENT` | ✅ Mock for demo; document real API hook |
| **Voter ID on chain** | `SHA256(studentCode)` | `voterId.service.js` | ✅ Snippet + formula in Design |
| **Architecture** | Hybrid: off-chain auth, on-chain votes | `docs/ARCHITECTURE.md` | ✅ Core of Architecture chapter |
| **Blockchain** | Permissioned private (Hyperledger mentioned) | Solidity + **ethers.js** (EVM) — local Hardhat/Besu/Docker | ✅ Say “permissioned EVM network”; Besu/Hyperledger as deployment option |
| **Smart contract** | One vote, tally, immutability | `contracts/VotingElection.sol` | ✅ Main snippets |
| **Backend** | Validates badge, calls contract | `backend/` — Node.js, Express | ✅ Snippets |
| **Wallet** | Students don’t use crypto wallets | Backend **oracle** submits txs | ✅ Design subsection |
| **Privacy** | Hash / commitments; no raw ID on chain | `voterHash` only on chain | ✅ Design + limitation paragraph |
| **Scale** | UPB ~50K students | Pilot N users in evaluation | ✅ Honest pilot numbers |

**Technology stack table for the paper (copy-ready):**

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS, Axios, TanStack React Query, React Router 7 |
| Backend | Node.js, Express, jsonwebtoken, ethers.js v6 |
| Blockchain | Solidity 0.8.20 smart contract; permissioned EVM (local/dev: Hardhat or Besu in Docker) |
| Identification | UPB student badge → student code (OCR); enrollment via UPB API (mock in development) |
| Security | TLS (deployment), JWT sessions, SHA-256 voter pseudonym, `onlyOracle` on `castVote` |

---

## 4. How to write each section (step-by-step)

### 4.1 Abstract (≤10 lines)

Template flow:

1. Problem: university elections need trust and integrity.  
2. Solution: web system + badge auth + **smart contract** on permissioned blockchain.  
3. How: hybrid architecture; backend oracle; one vote per `voterHash`.  
4. Stack: React, Node.js, Solidity.  
5. Result: working prototype; pilot test; limitations (oracle, pilot scale).

Use the draft in `research-paper-plan.md` and replace “commitments” with **on-chain vote counts** if that matches your final contract (`castVote` + `voteCounts`).

---

### 4.2 Introduction (~2 pages)

**Write:**

- 2–3 paragraphs: motivation (from PDF intro — shortened).  
- **Objectives** (numbered, 4 items) — from plan.  
- **Scope:** university pilot, not national elections.  
- **Structure:** one paragraph listing Architecture, Design, Implementation.  
- **Figure 1:** system context (student, web, API, UPB DB, blockchain) — export from `docs/ARCHITECTURE.md` Mermaid or draw in draw.io.

**Do not write:** 15 pages on threat models or homomorphic encryption.

---

### 4.3 Architecture (~3 pages)

**Draft written:** [`docs/thesis/ARCHITECTURE.md`](thesis/ARCHITECTURE.md) — copy to Word; export Mermaid figures.  
**Technical reference:** `docs/ARCHITECTURE.md`

**Include:**

- **§4.3.1** Architectural style: **hybrid** (why not fully on-chain — 1 paragraph + small table from PDF §2.3).  
- **§4.3.2** Logical layers: Presentation → API → Identity → Blockchain adapter → Smart contract.  
- **§4.3.3** Monorepo layout: `frontend/`, `backend/`, `contracts/`.  
- **§4.3.4** Deployment view: browser → HTTPS → Nginx → API + static SPA → RPC → validators (pilot: Docker/local).  
- **§4.3.5** Election state machine: Created → VotingOpen → VotingClosed → ResultsPublished.  
- **§4.3.6** Trust boundaries: what is on-chain vs off-chain (table).

**Figures:**

| Figure | Content |
|--------|---------|
| Fig. 2 | Component diagram (frontend, backend, contract, UPB API) |
| Fig. 3 | Deployment (pilot) |
| Fig. 4 | State machine |

**Screenshot (optional here):** folder structure in IDE (`frontend`, `backend`, `contracts`).

---

### 4.4 Design (~4 pages)

**Bridge PDF concepts to your code.**

**§4.4.1 Authentication design** (from PDF §1.6.1)

1. Camera captures badge → OCR extracts code (e.g. `J24280`).  
2. Optional: selfie vs badge photo.  
3. `POST /api/auth/badge` → UPB enrollment check → JWT.  
4. `voterHash = SHA-256(studentCode ‖ electionId ‖ salt)`.

**Figure:** sequence diagram (student → API → UPB → JWT).

**§4.4.2 Vote and uniqueness design**

- Backend checks `getHasVoted` then calls `castVote`.  
- Contract: `hasVoted` + `voteCounts`.  
- Map to requirements: eligibility (off-chain), uniqueness + integrity (on-chain).

**§4.4.3 Smart contract design**

- Structs: `Election`, `Candidate`.  
- Roles: `admin`, `oracle`.  
- Functions table (create, open, close, castVote, getResults).

**§4.4.4 API design**

- Table of endpoints from `backend/README.md`.

**§4.4.5 UI design**

- Wireframe or screenshot mock: election list → badge → ballot → receipt.

**Snippet (Design — pseudocode or interface):** voter hash formula from `voterId.service.js` (see §5 below).

---

### 4.5 Implementation (~5 pages) — **main coordinator focus**

Structure Implementation in **three layers** matching the repo:

#### A. Smart contract implementation

- File: `contracts/VotingElection.sol`  
- Explain `castVote`, `AlreadyVoted`, `voteCounts`, `getResults`.  
- **Snippet 1:** `castVote` (10–15 lines).  
- **Screenshot 1:** Remix/Hardhat deploy or `castVote` transaction in explorer.

#### B. Backend implementation

- Files: `blockchainClient.js`, `voting.service.js`, `auth.service.js`, routes.  
- **Snippet 2:** `computeVoterHash` (`voterId.service.js`).  
- **Snippet 3:** `castVote` orchestration (`voting.service.js`).  
- **Snippet 4:** Express route `POST /votes` (`votes.routes.js`).  
- **Screenshot 2:** Postman/curl — `POST /api/auth/badge` response with token.  
- **Screenshot 3:** `POST /api/votes` → `txHash` in JSON.  
- **Screenshot 4:** `GET /api/elections/1/results`.

#### C. Frontend implementation

- Files: `axiosConfig.ts`, `QRScanner.tsx`, future `Elections/` / `Vote/` screens.  
- **Snippet 5:** API base URL + JWT header (`axiosConfig.ts`).  
- **Screenshot 5:** Login/badge screen.  
- **Screenshot 6:** Ballot selection + confirmation.  
- **Screenshot 7:** Receipt with transaction hash (or “already voted” message).

#### D. Pilot / demo scenario (short)

Describe steps you will **live-demo** at defense:

1. Admin creates election (API or script).  
2. `openVoting`.  
3. Student A votes → success.  
4. Student A votes again → **409 / AlreadyVoted**.  
5. `closeVoting` → results match vote count.

**Table: pilot measurements**

| Metric | How measured | Example value |
|--------|----------------|---------------|
| Auth API latency | Postman / browser devtools | … ms |
| `castVote` confirmation | `blockNumber` − submit time | … s |
| Double-vote blocked | 2nd POST returns 409 | Pass |

---

### 4.6 References

- Keep PDF bibliography entry; add: ethers.js docs, React docs, OpenZeppelin (if used), Hardhat/Besu docs, 2–3 e-voting papers cited briefly in Introduction.

---

## 5. Code snippets to include (file paths for copy-paste)

Keep snippets **short** (10–20 lines), with caption: *Listing X — Description.*

| Listing | File | What to highlight |
|---------|------|-------------------|
| 1 | `contracts/VotingElection.sol` | `castVote` + `hasVoted` check |
| 2 | `backend/src/services/voterId.service.js` | `computeVoterHash` |
| 3 | `backend/src/services/voting.service.js` | `castVote` + `ALREADY_VOTED` |
| 4 | `backend/src/blockchain/blockchainClient.js` | `castVoteOnChain` |
| 5 | `backend/src/routes/auth.routes.js` | `POST /badge` |
| 6 | `frontend/src/utils/axiosConfig.ts` | `VITE_API_BASE_URL`, interceptors |

In Word: use *Consolas* 9–10pt, line numbers, refer in text as “Listing 3 shows…”.

---

## 6. Screenshots checklist (for paper + PPT)

Capture at **1920×1080** or higher; blur secrets (private keys).

- [ ] Repository root: `frontend/`, `backend/`, `contracts/`  
- [ ] `.env.example` (redacted keys) — config story  
- [ ] Smart contract in VS Code with `castVote` visible  
- [ ] Terminal: Hardhat node / deploy script success  
- [ ] Terminal: `npm run dev` backend + frontend  
- [ ] Browser: badge/auth screen  
- [ ] Browser: candidate selection  
- [ ] Browser: vote success + `txHash`  
- [ ] Browser or Postman: second vote → error  
- [ ] Results page or API JSON with per-candidate counts  
- [ ] Optional: blockchain explorer / Hardhat tx log  

---

## 7. PPT structure (defense — ~12–15 slides)

| Slide | Title | Content |
|-------|--------|---------|
| 1 | Title | Same title as thesis; your name; FILS; coordinator |
| 2 | Problem | University elections; trust; centralized DB risks (1 figure) |
| 3 | Objectives | 4 bullet objectives |
| 4 | Solution overview | Hybrid architecture diagram (from Architecture) |
| 5 | Technology stack | Table from §3 above |
| 6 | Authentication | Badge → OCR → UPB → JWT → voterHash (flow) |
| 7 | Blockchain role | Smart contract enforces 1 vote + tally; permissioned network |
| 8 | Architecture | Component diagram |
| 9 | Design | Sequence: cast vote |
| 10 | Implementation | 3 bullets: Solidity / Node / React + **one code snippet** |
| 11 | Demo screenshots | 2–3 UI screenshots |
| 12 | Live demo | Plan: vote + double-vote fail (or embedded video backup) |
| 13 | Evaluation | Small table: latency, pilot N users |
| 14 | Limitations | Oracle, pilot scale, selfie/OCR if incomplete |
| 15 | Conclusion + Q&A | Contributions; future: Docker Besu, full UPB API |

**Rule:** PPT = pictures + bullets; **details stay in the written thesis**. Demo must use **working** backend + chain + at least minimal frontend path.

---

## 8. What must work before submission / defense

Minimum **working prototype** (coordinator expectation):

| # | Requirement | How to verify |
|---|-------------|----------------|
| 1 | Local/private blockchain running | RPC responds; contract deployed |
| 2 | Contract deployed; address in `backend/.env` | `GET /api/health` → blockchain configured |
| 3 | Student auth returns JWT | `POST /api/auth/badge` |
| 4 | One successful vote | `POST /api/votes` → `txHash` |
| 5 | Second vote rejected | 409 or contract revert |
| 6 | Results readable | `GET /api/elections/:id/results` |
| 7 | UI shows flow | Screenshots + live demo |

**Still to build for full PDF alignment** (prioritize for paper honesty):

1. Frontend screens wired to `/api/auth/badge` and `/api/votes` (replace legacy bus/login paths).  
2. Badge **OCR** (Tesseract.js or server-side) — PDF promises this.  
3. Optional selfie step — can be “future work” if not done.  
4. Docker Compose for chain (for reproducible demo).  

---

## 9. Suggested writing schedule (4–6 weeks)

| Week | Written | Built |
|------|---------|--------|
| 1 | Architecture (+ figures) | Docker/Hardhat + deploy contract |
| 2 | Design (+ sequences) | Wire frontend to voting API |
| 3 | Implementation § contract + backend | OCR or document mock path |
| 4 | Implementation § frontend + screenshots | Pilot test + metrics table |
| 5 | Abstract, Intro, References | PPT first draft |
| 6 | Proofread; practice demo | PPT final + backup video |

---

## 10. Short “limitations” paragraph (paste near end of Implementation)

> The prototype targets a **university pilot** rather than production national elections. Vote submission relies on a **trusted backend oracle**; students do not manage private keys. Ballot secrecy against the operator is limited unless client-side encryption is added. Authentication uses badge-derived student codes with enrollment verification; optional visual matching is subject to the quality of mobile cameras. Performance results reflect a **local permissioned network** and a small test cohort, not full faculty-wide load. These constraints are acceptable for demonstrating feasibility but would require further hardening for institution-wide deployment.

---

## 11. Related repository documents

| Document | Use |
|----------|-----|
| [`research-paper-plan.md`](../research-paper-plan.md) | Section outlines and abstract draft |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Architecture chapter source |
| [`backend/README.md`](../backend/README.md) | API tables, curl examples |
| [`contracts/README.md`](../contracts/README.md) | Contract ↔ backend mapping |

---

*Title remains: **Electronic Voting System For Students Using Blockchain Technology**. Part 1 PDF = background; this guide = how to write and defend the implementation-focused continuation.*
