-- Problem Statement Approval Workflow Schema Update
-- This migration adds status and review_feedback columns to support approve/reject functionality

-- The complete updated schema for problem_statement table:
-- 
-- create table public.problem_statement (
--   ps_id serial not null,
--   group_id character varying(64) not null,
--   title character varying(255) not null,
--   type character varying(100) null,
--   technologybucket text null,
--   domain character varying(100) null,
--   description text null,
--   status character varying(20) null default 'PENDING'::character varying,
--   review_feedback text null,
--   constraint problem_statement_pkey primary key (ps_id),
--   constraint uq_problem_statement_group_id unique (group_id)
-- );

-- Add status column (PENDING, APPROVED, REJECTED)
ALTER TABLE problem_statement 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';

-- Add review_feedback column to store rejection feedback
ALTER TABLE problem_statement 
ADD COLUMN IF NOT EXISTS review_feedback TEXT;

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_problem_statement_status ON problem_statement(status);

-- Update existing rows to have PENDING status if null
UPDATE problem_statement 
SET status = 'PENDING' 
WHERE status IS NULL;
