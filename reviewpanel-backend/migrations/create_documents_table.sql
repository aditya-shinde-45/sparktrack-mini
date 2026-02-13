-- Add missing columns to existing documents table
-- Run this SQL in your Supabase SQL editor

-- Add category column for document categorization
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add description column for optional document description
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add uploaded_by column to track who uploaded
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS uploaded_by INT;

-- Add status column for approval workflow
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Add updated_at column for tracking modifications
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_group_id ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Stores project documents uploaded by students';
COMMENT ON COLUMN documents.category IS 'Document category (reports, presentations, code, videos)';
COMMENT ON COLUMN documents.description IS 'Optional description of the document';
COMMENT ON COLUMN documents.uploaded_by IS 'Student ID who uploaded the document';
COMMENT ON COLUMN documents.status IS 'Document approval status (pending, approved, rejected)';
COMMENT ON COLUMN documents.updated_at IS 'Timestamp when document was last updated';

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
