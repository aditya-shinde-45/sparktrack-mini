-- Migration Script: Group Draft Workflow
-- Creates tables for draft-based group creation system
-- Execute this in Supabase SQL Editor

-- Table 1: groups_draft
-- Stores draft groups before finalization
CREATE TABLE IF NOT EXISTS groups_draft (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(255) UNIQUE NOT NULL,
  leader_enrollment VARCHAR(50) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  previous_ps_id VARCHAR(100),
  guide_name VARCHAR(255) NOT NULL,
  guide_contact VARCHAR(20) NOT NULL,
  guide_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_leader FOREIGN KEY (leader_enrollment) 
    REFERENCES pbl_2025(enrollement_no) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_groups_draft_leader ON groups_draft(leader_enrollment);
CREATE INDEX IF NOT EXISTS idx_groups_draft_status ON groups_draft(status);
CREATE INDEX IF NOT EXISTS idx_groups_draft_group_id ON groups_draft(group_id);

-- Table 2: group_requests
-- Stores invitations sent to students
CREATE TABLE IF NOT EXISTS group_requests (
  request_id SERIAL PRIMARY KEY,
  group_id VARCHAR(255) NOT NULL,
  enrollment_no VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  CONSTRAINT fk_group_draft FOREIGN KEY (group_id) 
    REFERENCES groups_draft(group_id) ON DELETE CASCADE,
  CONSTRAINT fk_student FOREIGN KEY (enrollment_no) 
    REFERENCES pbl_2025(enrollement_no) ON DELETE CASCADE,
  CONSTRAINT unique_group_student UNIQUE(group_id, enrollment_no)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_group_requests_group ON group_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_requests_enrollment ON group_requests(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_group_requests_status ON group_requests(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_draft_updated_at BEFORE UPDATE ON groups_draft
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add RLS (Row Level Security) policies if needed
-- ALTER TABLE groups_draft ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE groups_draft IS 'Stores draft groups before finalization';
COMMENT ON TABLE group_requests IS 'Stores invitations sent to students to join groups';
COMMENT ON COLUMN groups_draft.status IS 'Status: draft (pending), finalized (in pbl table), cancelled (deleted)';
COMMENT ON COLUMN group_requests.status IS 'Status: pending (waiting), accepted (confirmed), rejected (declined)';

-- Sample query to verify tables
-- SELECT * FROM groups_draft;
-- SELECT * FROM group_requests;
