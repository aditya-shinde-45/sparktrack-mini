-- Migration script for Zeroth Review feature
-- This script adds only the potentially missing columns to internship_details table

-- Existing columns confirmed from schema:
-- ✓ id, enrollment_no, group_id, organization_name, internship_type, internship_duration
-- ✓ file_url, file_name, file_type, created_at, updated_at
-- ✓ student_name, start_date, end_date, role, guide
-- ✓ m1, m2, m3, m4, m5, total (marks columns)
-- ✓ external (for expert name), remark (for approval status), new_scope (for scope text)

-- Add only potentially missing columns:

-- Column for storing expert contact details (phone | email)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='internship_details' AND column_name='expert_contact') THEN
    ALTER TABLE internship_details ADD COLUMN expert_contact VARCHAR(500);
  END IF;
END $$;

-- Column for project title
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='internship_details' AND column_name='project_title') THEN
    ALTER TABLE internship_details ADD COLUMN project_title TEXT;
  END IF;
END $$;

-- Column for class/division
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='internship_details' AND column_name='class') THEN
    ALTER TABLE internship_details ADD COLUMN class VARCHAR(50);
  END IF;
END $$;

-- Add helpful comments on existing columns for documentation
COMMENT ON COLUMN internship_details.m1 IS 'Review 0: Literature Survey marks (0-5)';
COMMENT ON COLUMN internship_details.m2 IS 'Review 0: Status of Sem-7 Paper marks (0-5)';
COMMENT ON COLUMN internship_details.m3 IS 'Review 0: Technical Readiness marks (0-5)';
COMMENT ON COLUMN internship_details.m4 IS 'Review 0: In-depth Knowledge of Problem & Solution marks (0-5)';
COMMENT ON COLUMN internship_details.m5 IS 'Review 0: Plan of Development (Tracker) marks (0-5)';
COMMENT ON COLUMN internship_details.total IS 'Review 0: Total marks (sum of m1-m5, max 25)';
COMMENT ON COLUMN internship_details.external IS 'Industry expert name conducting the review';
COMMENT ON COLUMN internship_details.expert_contact IS 'Industry expert contact: phone | email';
COMMENT ON COLUMN internship_details.new_scope IS 'Scope redefinition and module suggestions for Phase-2';
COMMENT ON COLUMN internship_details.remark IS 'Internship approval status: Pending, Approved, Not Approved';
COMMENT ON COLUMN internship_details.project_title IS 'Project title for the group';
COMMENT ON COLUMN internship_details.class IS 'Student class/division (e.g., BE-A, BE-B)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_internship_group_enrollment 
ON internship_details(group_id, enrollment_no);

CREATE INDEX IF NOT EXISTS idx_internship_created_at 
ON internship_details(created_at DESC);

-- Sample query to view zeroth review data
-- SELECT 
--   i.group_id,
--   i.student_name,
--   i.enrollment_no,
--   i.class,
--   i.project_title,
--   i.organization_name as company,
--   i.internship_type as mode,
--   i.start_date,
--   i.end_date,
--   i.role as profile_task,
--   i.external as expert_name,
--   i.expert_contact,
--   i.m1 as literature_survey,
--   i.m2 as status_sem7_paper,
--   i.m3 as technical_readiness,
--   i.m4 as knowledge_problem_solution,
--   i.m5 as plan_development,
--   i.total as total_marks,
--   i.new_scope as scope_redefinition,
--   i.remark as approval_status,
--   i.guide as faculty_guide,
--   i.created_at as review_date
-- FROM internship_details i
-- WHERE i.group_id IS NOT NULL
-- ORDER BY i.group_id, i.created_at DESC;

-- Query to get summary by group
-- SELECT 
--   group_id,
--   project_title,
--   guide as faculty_guide,
--   external as expert_name,
--   class,
--   COUNT(*) as student_count,
--   AVG(total) as avg_marks,
--   MAX(created_at) as last_updated
-- FROM internship_details
-- WHERE group_id IS NOT NULL
-- GROUP BY group_id, project_title, guide, external, class
-- ORDER BY group_id;
