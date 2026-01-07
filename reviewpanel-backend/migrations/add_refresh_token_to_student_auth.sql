-- Add refresh token columns to student_auth table for "Remember Me" feature
-- This allows students to stay logged in for longer periods

ALTER TABLE student_auth
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_student_auth_refresh_token 
ON student_auth(refresh_token) 
WHERE refresh_token IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN student_auth.refresh_token IS 'JWT refresh token for remember me feature';
COMMENT ON COLUMN student_auth.refresh_token_expiry IS 'Expiry timestamp for refresh token (typically 7-30 days)';
