-- Add approval workflow fields to evaluation form submissions
ALTER TABLE evaluation_form_submissions
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS approved_by TEXT NULL;

UPDATE evaluation_form_submissions
SET is_approved = FALSE
WHERE is_approved IS NULL;