CREATE TABLE IF NOT EXISTS tracker_sheets (
  id BIGSERIAL PRIMARY KEY,
  group_id VARCHAR(64) NOT NULL UNIQUE,
  group_year VARCHAR(2),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  created_by VARCHAR(64),
  updated_by VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracker_sheets_group_id ON tracker_sheets (group_id);
