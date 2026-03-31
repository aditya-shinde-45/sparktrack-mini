# Mentor OTP Fix - Database Migration Guide

## Problem
The mentor OTP login was failing with "OTP expired or invalid" errors because the service used in-memory storage (JavaScript Map), which doesn't work in AWS Lambda's serverless environment where different requests may be handled by different Lambda instances.

## Solution
Replaced in-memory storage with Supabase database tables to persist OTP sessions across all Lambda invocations.

## Migration Steps

### 1. Run the SQL Migration in Supabase

Go to your Supabase dashboard at: https://gmtajoqjbetveyluklpa.supabase.co

Navigate to **SQL Editor** and run the migration file:
`reviewpanel-backend/migrations/create_mentor_otp_sessions.sql`

Or copy and paste this SQL:

```sql
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
  CONSTRAINT check_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

CREATE INDEX IF NOT EXISTS idx_mentor_otp_contact ON mentor_otp_sessions(contact_number);
CREATE INDEX IF NOT EXISTS idx_mentor_otp_expires ON mentor_otp_sessions(expires_at);

-- Create table for rate limiting OTP requests
CREATE TABLE IF NOT EXISTS mentor_otp_rate_limit (
  contact_number VARCHAR(15) PRIMARY KEY,
  request_timestamps BIGINT[] NOT NULL DEFAULT '{}',
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_otp_rate_updated ON mentor_otp_rate_limit(updated_at);
```

### 2. Deploy Updated Code

The following files have been updated:
- `src/services/mentorOTPService.js` - Now uses Supabase instead of in-memory Map
- `src/controllers/mentor/mentorAuthController.js` - Updated to handle async OTP methods

Deploy the updated code to your Lambda function (already done via Vercel deployment).

### 3. Test the OTP Flow

1. Go to: https://sparktrack-mini-8pjs.vercel.app/pblmanagementfacultydashboardlogin
2. Enter a valid mentor contact number
3. Click "Request OTP"
4. Check email for OTP code
5. Enter the OTP received
6. Verify it successfully validates

### 4. Optional: Schedule Cleanup

To prevent database growth, you can set up a scheduled Lambda or cron job to run the cleanup:

```javascript
// Call this periodically (e.g., every hour)
await mentorOTPService.cleanup();
```

Or run manually in Supabase SQL Editor:
```sql
-- Clean up expired sessions
DELETE FROM mentor_otp_sessions 
WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000 
   OR (verified = true AND verified_at < (EXTRACT(EPOCH FROM NOW()) * 1000 - 900000));

-- Clean up old rate limit entries  
DELETE FROM mentor_otp_rate_limit 
WHERE updated_at < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000 - 86400000);
```

## What Changed

**Before:**
- OTP data stored in memory (Map objects)
- Each Lambda instance had its own isolated memory
- Request to instance A → stores OTP
- Verify on instance B → can't find OTP → "expired or invalid" error
- No automatic cleanup of expired OTPs

**After:**
- OTP data stored in Supabase database
- All Lambda instances share the same database
- Request to any instance → stores in DB
- Verify from any instance → reads from DB → works correctly
- **Automatic cleanup:**
  - When requesting a new OTP (resend): old OTPs for that contact number are immediately deleted
  - During verification: OTPs expired for more than 1 minute are automatically cleaned up
  - After password set: session is immediately invalidated

## Files Modified

1. `reviewpanel-backend/migrations/create_mentor_otp_sessions.sql` - NEW
2. `reviewpanel-backend/src/services/mentorOTPService.js` - UPDATED
3. `reviewpanel-backend/src/controllers/mentor/mentorAuthController.js` - UPDATED
4. `reviewpanel-backend/migrations/MENTOR_OTP_FIX_README.md` - NEW (this file)

## Verification

After deployment, check CloudWatch logs. You should see:
- `[MentorOTP] OTP created for mentor...` 
- `[MentorOTP] OTP verified successfully`

Instead of database errors like "PGRST116" or "result is empty".
