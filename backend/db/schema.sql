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

CREATE TABLE IF NOT EXISTS organizers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  faculty VARCHAR(16),
  role VARCHAR(32) NOT NULL DEFAULT 'Organizer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizers
  ADD COLUMN IF NOT EXISTS faculty VARCHAR(16);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizers_faculty_check'
  ) THEN
    ALTER TABLE organizers
      ADD CONSTRAINT organizers_faculty_check
      CHECK (faculty IS NULL OR faculty IN ('FILS', 'ACS', 'ETTI', 'IE', 'IMST'));
  END IF;
END $$;

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
