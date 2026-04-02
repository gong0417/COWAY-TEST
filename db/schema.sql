-- RV-SYSTEM: PostgreSQL schema for migrated CSV data
-- Run once: psql "$DATABASE_URL" -f db/schema.sql

-- ---------------------------------------------------------------------------
-- ssm.csv → failure / SSM cases (PK: SSM ID)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ssm_cases (
  ssm_id           VARCHAR(64) PRIMARY KEY,
  ssm_defining     TEXT,
  ssm_trouble      TEXT,
  ssm_stress       TEXT,
  ssm_strength     TEXT,
  ssm_controling   TEXT,
  prevention       TEXT,
  test_item        TEXT,
  test_criteria    TEXT,
  product_line     TEXT,
  document_title   TEXT,
  file_url         TEXT
);

COMMENT ON TABLE ssm_cases IS 'Source: data/ssm.csv (SSM failure cases)';
COMMENT ON COLUMN ssm_cases.ssm_id IS 'CSV column: SSM ID';

CREATE INDEX IF NOT EXISTS idx_ssm_product_line ON ssm_cases (product_line);

-- ---------------------------------------------------------------------------
-- inspection_items.csv (PK: checkId)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_items (
  check_id           VARCHAR(128) PRIMARY KEY,
  category           TEXT,
  inspection_item    TEXT,
  internal_standard  TEXT,
  method             TEXT,
  revision_date      DATE NULL
);

COMMENT ON TABLE inspection_items IS 'Source: data/inspection_items.csv';

CREATE INDEX IF NOT EXISTS idx_inspection_category ON inspection_items (category);

-- ---------------------------------------------------------------------------
-- reliability_standards.csv (PK: standardId)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reliability_standards (
  standard_id           VARCHAR(128) PRIMARY KEY,
  component_name        TEXT,
  test_name             TEXT,
  test_condition        TEXT,
  acceptance_criteria   TEXT,
  sample_size           TEXT,
  related_doc           TEXT
);

COMMENT ON TABLE reliability_standards IS 'Source: data/reliability_standards.csv';

-- ---------------------------------------------------------------------------
-- App users (JWT auth). First registered user becomes admin.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'user')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
