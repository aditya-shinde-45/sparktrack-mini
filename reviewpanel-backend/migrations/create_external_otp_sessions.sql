-- Create table for storing external evaluator OTP sessions
-- This replaces in-memory storage to work with serverless Lambda deployments
-- OTPs are automatically deleted when:
--   1. A new OTP is requested for the same email (resend)
--   2. OTP has been expired for more than 1 minute
--   3. OTP is successfully verified

CREATE TABLE IF NOT EXISTS external_otp_sessions (
  session_token VARCHAR(64) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  email VARCHAR(255) NOT NULL,
  evaluator_name VARCHAR(255),
  organization VARCHAR(255),
  group_id VARCHAR(50),
  review_type VARCHAR(50),
  expires_at BIGINT NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_at BIGINT,
  created_at BIGINT NOT NULL,
  locked_until BIGINT,
  additional_data JSONB,
  CONSTRAINT check_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_external_otp_email ON external_otp_sessions(email);

-- Create index for faster cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_external_otp_expires ON external_otp_sessions(expires_at);

-- Create index for group-based queries
CREATE INDEX IF NOT EXISTS idx_external_otp_group ON external_otp_sessions(group_id);

-- Create table for rate limiting external OTP requests
CREATE TABLE IF NOT EXISTS external_otp_rate_limit (
  email VARCHAR(255) PRIMARY KEY,
  request_timestamps BIGINT[] NOT NULL DEFAULT '{}',
  lockout_until BIGINT,
  updated_at BIGINT NOT NULL
);

-- Create index for rate limit cleanup
CREATE INDEX IF NOT EXISTS idx_external_otp_rate_updated ON external_otp_rate_limit(updated_at);

-- Create index for lockout queries
CREATE INDEX IF NOT EXISTS idx_external_otp_lockout ON external_otp_rate_limit(lockout_until);
