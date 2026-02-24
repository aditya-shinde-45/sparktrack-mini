-- Add created_at and updated_at columns to problem_statement table

-- Add created_at column with default to current timestamp
ALTER TABLE public.problem_statement 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column with default to current timestamp
ALTER TABLE public.problem_statement 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_problem_statement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function on UPDATE
DROP TRIGGER IF EXISTS trigger_update_problem_statement_timestamp ON public.problem_statement;
CREATE TRIGGER trigger_update_problem_statement_timestamp
BEFORE UPDATE ON public.problem_statement
FOR EACH ROW
EXECUTE FUNCTION update_problem_statement_updated_at();

-- Update existing rows to have timestamps (if they don't already)
UPDATE public.problem_statement 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

UPDATE public.problem_statement 
SET updated_at = CURRENT_TIMESTAMP 
WHERE updated_at IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_problem_statement_updated_at 
ON public.problem_statement (updated_at DESC);

COMMENT ON COLUMN public.problem_statement.created_at IS 'Timestamp when the problem statement was first created';
COMMENT ON COLUMN public.problem_statement.updated_at IS 'Timestamp when the problem statement was last updated';
