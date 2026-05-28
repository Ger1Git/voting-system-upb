# PostgreSQL setup (mock UPB registry + organizers)

The database is **not** the vote ledger. It holds:

| Table | Purpose |
|-------|---------|
| `students` | **Mock UPB registry** — who may vote (`active = true`) |
| `organizers` | Login for election pool setup only |
| `auth_audit` | Who authenticated (no ballot content) |
| `chain_tx_log` | Optional tx references |

Ballot secrets stay in the **browser**; vote rules stay on the **blockchain**.

---

## 1. Start PostgreSQL (Docker)

From the project root:

```bash
docker compose up -d postgres
```

Connection string:

```text
postgresql://voting:voting@localhost:5432/voting_upb
```

Check:

```bash
docker compose ps
```

---

## 2. Configure the backend

In `backend/.env`:

```env
DATABASE_URL=postgresql://voting:voting@localhost:5432/voting_upb
ENROLLMENT_SOURCE=database
MOCK_UPB_ENROLLMENT=false
```

| `ENROLLMENT_SOURCE` | Behavior |
|---------------------|----------|
| `database` | Look up `students` table (mock UPB) |
| `mock` | Accept any valid code (no DB) |
| `api` | Call `UPB_API_URL` HTTP service |

---

## 3. Create tables and seed data

```bash
cd backend
npm install
npm run db:setup
```

This runs:

- `db/schema.sql` — creates tables  
- `db-seed.js` — demo students + organizer  

### Demo students (mock registry)

| Code | Active | Notes |
|------|--------|-------|
| J24280 | yes | Can vote |
| J12345 | yes | Can vote |
| J67890 | yes | Can vote |
| J00001 | **no** | Rejected at login |

### Demo organizer

| Email | Password |
|-------|----------|
| admin@upb.ro | admin |

---

## 4. Restart API and test

```bash
npm run dev
```

Health:

```http
GET http://localhost:5122/api/health
```

Expected:

```json
{
  "ok": true,
  "enrollmentSource": "database",
  "database": "connected",
  "blockchain": "configured"
}
```

Student auth:

```http
POST http://localhost:5122/api/auth/badge
{ "studentCode": "J24280", "electionId": 2 }
```

Inactive student:

```json
{ "studentCode": "J00001", "electionId": 2 }
→ 403 NOT_ELIGIBLE
```

---

## 5. Manage students (SQL examples)

Open psql:

```bash
docker compose exec postgres psql -U voting -d voting_upb
```

Add a student:

```sql
INSERT INTO students (student_code, full_name, faculty, active)
VALUES ('J99999', 'Test Student', 'FILS', true);
```

Deactivate:

```sql
UPDATE students SET active = false WHERE student_code = 'J24280';
```

List:

```sql
SELECT student_code, full_name, active FROM students ORDER BY student_code;
```

---

## 6. Without Docker (local PostgreSQL)

1. Install PostgreSQL 16+  
2. Create DB and user:

```sql
CREATE USER voting WITH PASSWORD 'voting';
CREATE DATABASE voting_upb OWNER voting;
```

3. Set `DATABASE_URL` and run `npm run db:setup`

---

## 7. Architecture note (thesis)

In diagrams, label PostgreSQL as:

- **Mock UPB student registry** (`students`)  
- **Organizer accounts** (`organizers`)  
- **Not** ballot storage  

When the real UPB API exists, switch `ENROLLMENT_SOURCE=api` and keep the same tables only for organizers/audit if needed.
