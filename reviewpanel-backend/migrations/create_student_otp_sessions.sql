-- Create table for storing student OTP sessions
-- This replaces in-memory storage to work with serverless Lambda deployments
-- OTPs are automatically deleted when:
--   1. A new OTP is requested for the same email (resend)
--   2. OTP has been expired for more than 1 minute
--   3. Password is successfully reset

CREATE TABLE IF NOT EXISTS student_otp_sessions (
  session_token VARCHAR(64) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  email VARCHAR(255) NOT NULL,
  enrollment_no VARCHAR(50),
  student_name VARCHAR(255),
  expires_at BIGINT NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_at BIGINT,
  created_at BIGINT NOT NULL,
  purpose VARCHAR(50) DEFAULT 'password_reset',
  CONSTRAINT check_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_student_otp_email ON student_otp_sessions(email);

-- Create index for faster cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_student_otp_expires ON student_otp_sessions(expires_at);

-- Create index for purpose-based queries
CREATE INDEX IF NOT EXISTS idx_student_otp_purpose ON student_otp_sessions(purpose);
