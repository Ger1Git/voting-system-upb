# Voting System UPB

Blockchain-based electronic voting for university students — monorepo layout.

| Folder | Description |
|--------|-------------|
| [`frontend/`](frontend/) | React + Vite SPA (badge scan, ballot UI) |
| [`backend/`](backend/) | Node.js + Express API + ethers.js |
| [`contracts/`](contracts/) | `VotingElection.sol` smart contract |
| [`docs/`](docs/) | System architecture |

## Architecture

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Quick start

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:5122/api`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

Create `frontend/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:5122/api
```

## Prerequisites

- Node.js 18+
- npm
- Local blockchain with deployed contract (see [`contracts/README.md`](contracts/README.md))
