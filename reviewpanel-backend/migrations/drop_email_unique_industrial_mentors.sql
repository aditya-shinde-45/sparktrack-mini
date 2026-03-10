-- Migration: Allow multiple rows per email in industrial_mentors
-- Required for the multi-faculty feature where one industrial mentor can be
-- linked to several faculty classes (each link = one row, same email/contact).

-- Drop the unique index/constraint on the email column
ALTER TABLE industrial_mentors DROP CONSTRAINT IF EXISTS industrial_mentors_email_key;
ALTER TABLE industrial_mentors DROP CONSTRAINT IF EXISTS industrial_mentors_contact_key;

-- Optional: add a composite unique constraint so the same mentor
-- cannot be linked to the SAME faculty twice.
ALTER TABLE industrial_mentors
  ADD CONSTRAINT industrial_mentors_contact_mentor_unique
  UNIQUE (contact, mentor_code);
