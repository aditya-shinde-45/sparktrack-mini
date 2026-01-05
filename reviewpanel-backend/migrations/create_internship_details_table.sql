CREATE TABLE IF NOT EXISTS internship_details (
  id SERIAL,
  enrollment_no VARCHAR(50) PRIMARY KEY,
  group_id VARCHAR(50),
  organization_name VARCHAR(255) NOT NULL,
  internship_type VARCHAR(100) NOT NULL,
  internship_duration VARCHAR(100) NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
