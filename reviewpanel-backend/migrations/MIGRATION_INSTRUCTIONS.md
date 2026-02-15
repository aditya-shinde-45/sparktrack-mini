# Problem Statement Approval Workflow - Migration Guide

## Issue
The approval/reject functionality requires two new columns in the `problem_statement` table:
- `status` - to store PENDING/APPROVED/REJECTED
- `review_feedback` - to store mentor's rejection feedback

## Solution
Run the migration SQL file to add these columns.

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `migrations/add_problem_statement_approval.sql`
4. Copy the SQL content
5. Paste it in the SQL Editor
6. Click **Run** to execute

### Option 2: Using psql (Command Line)
```bash
# Connect to your database
psql "your_database_connection_string"

# Run the migration
\i migrations/add_problem_statement_approval.sql
```

### Option 3: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## What the Migration Does
1. Adds `status` column with default value 'PENDING'
2. Adds `review_feedback` TEXT column for rejection feedback
3. Creates an index on `status` for better query performance
4. Updates existing rows to have 'PENDING' status

## After Migration
1. Restart your backend server
2. The approve/reject functionality will work correctly
3. All existing problem statements will have 'PENDING' status

## Rollback (if needed)
```sql
-- Remove the columns if you need to rollback
ALTER TABLE problem_statement DROP COLUMN IF EXISTS status;
ALTER TABLE problem_statement DROP COLUMN IF EXISTS review_feedback;
DROP INDEX IF EXISTS idx_problem_statement_status;
```

## Verification
After running the migration, verify it worked:
```sql
-- Check the table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'problem_statement';
```

You should see `status` and `review_feedback` columns in the output.
