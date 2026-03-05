-- Migration: Add password column to mentors table
-- Run this in the Supabase SQL editor before using mentor login / set-password features.

-- 1. Add the password column (nullable; null means the mentor hasn't set a password yet)
ALTER TABLE mentors
  ADD COLUMN IF NOT EXISTS password TEXT DEFAULT NULL;

-- 2. Optional index to speed up "has this mentor set a password?" checks
CREATE INDEX IF NOT EXISTS idx_mentors_password_not_null
  ON mentors (contact_number)
  WHERE password IS NOT NULL;
