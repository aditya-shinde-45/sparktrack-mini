-- Add mentor_edit_enabled_groups column to evaluation_forms table
-- This column stores the list of group IDs allowed to edit marks after submission
-- Default to empty array (no groups allowed)

ALTER TABLE evaluation_forms
ADD COLUMN IF NOT EXISTS mentor_edit_enabled_groups TEXT[] DEFAULT '{}';

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_evaluation_forms_mentor_edit_enabled_groups ON evaluation_forms USING GIN (mentor_edit_enabled_groups);

-- Add comment for clarity
COMMENT ON COLUMN evaluation_forms.mentor_edit_enabled_groups IS 'Group IDs allowed to edit marks after submission.';
