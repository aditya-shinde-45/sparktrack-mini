-- Add submit_roles column to evaluation_forms table
-- This column tracks which roles (mentor, industry_mentor) are allowed to submit this evaluation form
-- Default to allowing both mentor and industry_mentor to submit

ALTER TABLE evaluation_forms
ADD COLUMN submit_roles TEXT[] DEFAULT ARRAY['mentor', 'industry_mentor']::TEXT[];

-- Create index for query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_evaluation_forms_submit_roles ON evaluation_forms USING GIN(submit_roles);

-- Add comment for clarity
COMMENT ON COLUMN evaluation_forms.submit_roles IS 'Array of role names allowed to submit this evaluation form (e.g., [''mentor'', ''industry_mentor''])';
