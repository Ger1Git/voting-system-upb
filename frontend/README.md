# Voting System UPB — Frontend

React 19 + TypeScript + Vite single-page application.

## Setup

```bash
npm install
cp .env.example .env   # optional
npm run dev
```

Runs at `http://localhost:5173`.

## Environment

| Variable | Default |
|----------|---------|
| `VITE_API_BASE_URL` | `http://localhost:5122/api` |

Start the [backend](../backend/README.md) before testing auth and voting.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Project structure

```
frontend/
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   ├── context/
│   ├── hooks/
│   └── utils/
├── vite.config.ts
└── package.json
```
