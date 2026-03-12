-- Create table for storing mentor OTP sessions
-- This replaces in-memory storage to work with serverless Lambda deployments
-- OTPs are automatically deleted when:
--   1. A new OTP is requested for the same contact number (resend)
--   2. OTP has been expired for more than 1 minute
--   3. Password is successfully set

CREATE TABLE IF NOT EXISTS mentor_otp_sessions (
  session_token VARCHAR(64) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mentor_name VARCHAR(255),
  expires_at BIGINT NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_at BIGINT,
  created_at BIGINT NOT NULL,
  CONSTRAINT check_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

-- Create index for faster lookups by contact number
CREATE INDEX IF NOT EXISTS idx_mentor_otp_contact ON mentor_otp_sessions(contact_number);

-- Create index for faster cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_mentor_otp_expires ON mentor_otp_sessions(expires_at);

-- Create table for rate limiting OTP requests
CREATE TABLE IF NOT EXISTS mentor_otp_rate_limit (
  contact_number VARCHAR(15) PRIMARY KEY,
  request_timestamps BIGINT[] NOT NULL DEFAULT '{}',
  updated_at BIGINT NOT NULL
);

-- Create index for rate limit cleanup
CREATE INDEX IF NOT EXISTS idx_mentor_otp_rate_updated ON mentor_otp_rate_limit(updated_at);
