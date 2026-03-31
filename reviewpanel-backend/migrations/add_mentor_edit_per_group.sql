-- Add mentor_edit_enabled_groups column to evaluation_forms table
-- This column stores an array of group IDs for which mentor editing is enabled
-- Empty array means no groups can edit, null means all groups can edit (backward compatible)

ALTER TABLE evaluation_forms
ADD COLUMN IF NOT EXISTS mentor_edit_enabled_groups TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create GIN index for fast array lookups
CREATE INDEX IF NOT EXISTS idx_evaluation_forms_mentor_edit_groups 
ON evaluation_forms USING GIN(mentor_edit_enabled_groups);

-- Add comment for clarity
COMMENT ON COLUMN evaluation_forms.mentor_edit_enabled_groups IS 'Array of group IDs allowed to edit marks. Empty array = no groups can edit. Use this for granular per-group control.';

-- Optional: Remove the old mentor_edit_enabled column if it exists
-- ALTER TABLE evaluation_forms DROP COLUMN IF EXISTS mentor_edit_enabled;
