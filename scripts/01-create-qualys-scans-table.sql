-- Drop the table if it exists to ensure a clean slate, especially during development.
-- In a production environment, you would use ALTER TABLE for changes.
DROP TABLE IF EXISTS qualys_ssl_labs_scans;

-- Create table for storing Qualys SSL Labs scan results
CREATE TABLE IF NOT EXISTS qualys_ssl_labs_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL,
    scan_status VARCHAR(50),
    grade VARCHAR(10),
    scan_data JSONB,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a unique constraint to prevent duplicate entries for the same application
-- This is useful if you plan to update records instead of inserting new ones each time.
ALTER TABLE qualys_ssl_labs_scans
ADD CONSTRAINT unique_application_scan UNIQUE (application_id);

-- Create indexes for better query performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_hostname ON qualys_ssl_labs_scans(hostname);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_grade ON qualys_ssl_labs_scans(grade);

-- Optional: Add a function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Add a trigger to the table to use the function
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON qualys_ssl_labs_scans
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Grant usage to the service role for Supabase
GRANT ALL ON TABLE qualys_ssl_labs_scans TO service_role;
GRANT ALL ON SEQUENCE qualys_ssl_labs_scans_id_seq TO service_role; -- Adjust if you use SERIAL instead of UUID
