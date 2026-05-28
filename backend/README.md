# Voting System UPB — Node.js API

JavaScript backend (Express + **ethers.js**) that orchestrates student authentication and submits vote transactions to `VotingElection.sol`.

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ (ES modules) |
| HTTP | Express |
| Blockchain | ethers v6 |
| Auth | JWT (`jsonwebtoken`) |

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API base: `http://localhost:5122/api` (matches frontend `VITE_API_BASE_URL`).

## Project layout

```
backend/src/
├── index.js                 # Entry
├── app.js                   # Express app + routes
├── config.js                # Environment
├── blockchain/
│   ├── blockchainClient.js  # ethers contract calls
│   └── VotingElection.abi.json
├── services/
│   ├── auth.service.js      # Badge auth + JWT
│   ├── voterId.service.js   # SHA-256 voter hash
│   ├── voting.service.js    # castVote, status, results
│   └── electionAdmin.service.js
├── routes/
│   ├── auth.routes.js
│   ├── votes.routes.js
│   ├── elections.routes.js
│   └── admin.routes.js
└── middleware/
    ├── auth.middleware.js
    └── errorHandler.js
```

## Connect to local blockchain

1. Deploy `contracts/VotingElection.sol` (Hardhat default account `0` is fine for dev).
2. Set in `.env`:
   - `VOTING_CONTRACT_ADDRESS`
   - `ORACLE_PRIVATE_KEY` — must match contract `oracle` (deployer by default, or call `setOracle`).
3. `MOCK_UPB_ENROLLMENT=true` accepts any valid-format student code (e.g. `J24280`).

## API endpoints

| Method | Path | Auth | Chain |
|--------|------|------|-------|
| POST | `/api/auth/badge` | — | — |
| POST | `/api/auth/admin/login` | — | — |
| GET | `/api/elections` | — | read |
| GET | `/api/elections/:id` | — | read |
| GET | `/api/elections/:id/results` | — | `getResults` |
| GET | `/api/votes/status?electionId=` | Voter JWT | `getHasVoted` |
| POST | `/api/votes` | Voter JWT | `castVote` |
| POST | `/api/admin/elections` | Admin JWT | `createElection` |
| POST | `/api/admin/elections/:id/open` | Admin | `openVoting` |
| POST | `/api/admin/elections/:id/close` | Admin | `closeVoting` |

### Example: student vote flow

```bash
# 1. Authenticate
curl -X POST http://localhost:5122/api/auth/badge \
  -H "Content-Type: application/json" \
  -d '{"studentCode":"J24280","electionId":1}'

# 2. Cast vote (use token from step 1)
curl -X POST http://localhost:5122/api/votes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"electionId":1,"candidateId":1}'
```

## Architecture

Frontend: [`../frontend/README.md`](../frontend/README.md)  
Architecture: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
