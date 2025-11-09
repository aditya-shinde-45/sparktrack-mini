-- Migration: Add PBL Review 3 deadline control
-- Date: 2025-11-09
-- Description: Adds pbl_review_3 entry to deadlines_control table

-- Insert PBL Review 3 deadline control (disabled by default)
INSERT INTO deadlines_control (key, label, enabled)
VALUES ('pbl_review_3', 'PBL Review 3', false)
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE deadlines_control IS 'Admin controls for enabling/disabling review periods';
