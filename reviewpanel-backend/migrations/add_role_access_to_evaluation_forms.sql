-- Add per-form role access controls for evaluation forms.
-- view_roles controls who can open/use the form.
-- edit_after_submit_roles controls who can resubmit after an existing submission.

ALTER TABLE IF EXISTS evaluation_forms
ADD COLUMN IF NOT EXISTS view_roles text[] NOT NULL DEFAULT ARRAY['mentor','industry_mentor']::text[];

ALTER TABLE IF EXISTS evaluation_forms
ADD COLUMN IF NOT EXISTS edit_after_submit_roles text[] NOT NULL DEFAULT ARRAY[]::text[];
