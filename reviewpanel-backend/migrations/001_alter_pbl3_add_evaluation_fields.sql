-- Migration: Add evaluation fields to pbl3 table for PBL Review 3
-- Date: 2025-11-09
-- Description: Adds evaluation marks, external evaluator details, and academic status fields

-- Add Evaluation Marks (A-F: 6 criteria)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS m1 NUMERIC(5,2);  -- Problem Definition (5 marks)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS m2 NUMERIC(5,2);  -- Technical Expertise (15 marks)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS m3 NUMERIC(5,2);  -- Project Report (10 marks)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS m4 NUMERIC(5,2);  -- Copyright/Patent/Paper (10 marks)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS m5 NUMERIC(5,2);  -- Event Participation (5 marks)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS m6 NUMERIC(5,2);  -- Presentation (5 marks)

-- Add Total Marks and Absent Status
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS total VARCHAR(10);  -- Total marks or "AB"
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS absent BOOLEAN DEFAULT false;

-- Add External Evaluator 1 Details (REQUIRED - minimum 1)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external1_name VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external1_org VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external1_phone VARCHAR(20);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external1_email VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external1_otp_verified BOOLEAN DEFAULT false;

-- Add External Evaluator 2 Details (OPTIONAL - maximum 2)
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external2_name VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external2_org VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external2_phone VARCHAR(20);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external2_email VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS external2_otp_verified BOOLEAN DEFAULT false;

-- Add Evaluation Details
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add Academic Status Fields (based on year group)
-- For SY: Copyright is mandatory
-- For TY/LY: Research Paper is mandatory
-- Patent is optional for all
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS copyright VARCHAR(50);  -- NA, In progress, Submitted, Granted
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS patent VARCHAR(50);  -- NA, In progress, Submitted, Granted
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS research_paper VARCHAR(50);  -- NA, Prepared, Submitted, Accepted, Published

-- Add Industry Guide Details
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS industry_guide VARCHAR(255);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS industry_guide_contact VARCHAR(20);
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS industry_guide_email VARCHAR(255);

-- Add Submission Date
ALTER TABLE pbl3 ADD COLUMN IF NOT EXISTS submission_date DATE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pbl3_external1_email ON pbl3(external1_email);
CREATE INDEX IF NOT EXISTS idx_pbl3_external2_email ON pbl3(external2_email);
CREATE INDEX IF NOT EXISTS idx_pbl3_submission_date ON pbl3(submission_date);

-- Add comments for documentation
COMMENT ON COLUMN pbl3.m1 IS 'Problem Definition & Domain Understanding (5 marks)';
COMMENT ON COLUMN pbl3.m2 IS 'Technical Expertise (15 marks)';
COMMENT ON COLUMN pbl3.m3 IS 'Project Report (10 marks)';
COMMENT ON COLUMN pbl3.m4 IS 'Copyright / Patent / Paper Publication (10 marks)';
COMMENT ON COLUMN pbl3.m5 IS 'Project Event Participation (5 marks)';
COMMENT ON COLUMN pbl3.m6 IS 'Presentation & Communication (5 marks)';
COMMENT ON COLUMN pbl3.total IS 'Total marks (sum of m1-m6) or AB for absent';
COMMENT ON COLUMN pbl3.absent IS 'Whether student was absent during evaluation';
