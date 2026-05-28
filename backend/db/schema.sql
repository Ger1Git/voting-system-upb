-- UPB voting system — application database (not the vote ledger)

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_code VARCHAR(16) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  faculty VARCHAR(128),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_code ON students (student_code);
CREATE INDEX IF NOT EXISTS idx_students_active ON students (active) WHERE active = TRUE;

-- Election organizers (pool setup only — no ballot access)
CREATE TABLE IF NOT EXISTS organizers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'Organizer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Authentication attempts (no ballot content)
CREATE TABLE IF NOT EXISTS auth_audit (
  id SERIAL PRIMARY KEY,
  election_id INTEGER,
  voter_hash CHAR(64),
  student_code VARCHAR(16),
  success BOOLEAN NOT NULL,
  source VARCHAR(32) NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_election ON auth_audit (election_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit (created_at);

-- Optional: blockchain transaction references for support
CREATE TABLE IF NOT EXISTS chain_tx_log (
  id SERIAL PRIMARY KEY,
  election_id INTEGER NOT NULL,
  voter_hash CHAR(64),
  tx_hash VARCHAR(66) NOT NULL,
  action VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chain_tx_election ON chain_tx_log (election_id);
