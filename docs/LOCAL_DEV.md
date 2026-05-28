# Local development — no UPB registry required

## UPB registry options

### A. PostgreSQL mock registry (recommended for thesis)

See **[DATABASE.md](DATABASE.md)** — `students` table + Docker.

```env
ENROLLMENT_SOURCE=database
DATABASE_URL=postgresql://voting:voting@localhost:5432/voting_upb
```

### B. Env mock (no database)

```env
ENROLLMENT_SOURCE=mock
```

Any valid-format code works, e.g. `J24280`.

## Dummy organizer login

```env
ADMIN_EMAIL=admin@upb.ro
ADMIN_PASSWORD=admin
```

`POST /api/auth/admin/login` with that email/password.

## PostgreSQL (optional, not needed yet)

The app does **not** require Postgres for a first run. When you add it later:

- **Organizer** table only (email, password hash)
- **AuthAudit** table
- **No ballot table**

For local dev, use `MOCK_UPB_ENROLLMENT` + env admin credentials.

## Start everything

Terminal 1 — blockchain:

```bash
cd contracts
npm install
npm run node
```

Terminal 2 — deploy (once per chain restart):

```bash
cd contracts
npm run deploy:local
```

Copy the printed address into `backend/.env` as `VOTING_CONTRACT_ADDRESS`, then:

Terminal 3 — API:

```bash
cd backend
npm install
npm run dev
```

Terminal 4 — frontend:

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API health: http://localhost:5122/api/health  

## Quick API test (PowerShell)

```powershell
# Student auth (mock UPB)
Invoke-RestMethod -Method POST -Uri http://localhost:5122/api/auth/badge `
  -ContentType application/json `
  -Body '{"studentCode":"J24280","electionId":1}'

# Admin login
Invoke-RestMethod -Method POST -Uri http://localhost:5122/api/auth/admin/login `
  -ContentType application/json `
  -Body '{"email":"admin@upb.ro","password":"admin"}'
```

Note: the React UI may still use legacy bus/login routes until voting screens are wired.
