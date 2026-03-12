-- =====================================================
-- Complete OTP System Migration for SparkTrack
-- Run this in Supabase SQL Editor to create all OTP tables
-- =====================================================

-- =====================================================
-- 1. MENTOR OTP TABLES
-- =====================================================

-- Create table for storing mentor OTP sessions
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
  CONSTRAINT check_mentor_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

CREATE INDEX IF NOT EXISTS idx_mentor_otp_contact ON mentor_otp_sessions(contact_number);
CREATE INDEX IF NOT EXISTS idx_mentor_otp_expires ON mentor_otp_sessions(expires_at);

-- =====================================================
-- 2. STUDENT OTP TABLES
-- =====================================================

-- Create table for storing student OTP sessions
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
  CONSTRAINT check_student_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

CREATE INDEX IF NOT EXISTS idx_student_otp_email ON student_otp_sessions(email);
CREATE INDEX IF NOT EXISTS idx_student_otp_expires ON student_otp_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_student_otp_purpose ON student_otp_sessions(purpose);

-- =====================================================
-- 3. EXTERNAL EVALUATOR OTP TABLES
-- =====================================================

-- Create table for storing external evaluator OTP sessions
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
  CONSTRAINT check_external_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

CREATE INDEX IF NOT EXISTS idx_external_otp_email ON external_otp_sessions(email);
CREATE INDEX IF NOT EXISTS idx_external_otp_expires ON external_otp_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_external_otp_group ON external_otp_sessions(group_id);

-- =====================================================
-- Migration Complete
-- =====================================================
-- All OTP tables created successfully!
-- Tables: mentor_otp_sessions, student_otp_sessions, external_otp_sessions
