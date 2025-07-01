-- Drop the table if it exists to ensure a clean slate (optional, for development)
DROP TABLE IF EXISTS qualys_ssl_labs_scans;

-- Create the Qualys SSL Labs Scans table
-- This table will store results from the Qualys SSL Labs API.
-- The 'scan_data' column uses JSONB to flexibly store user-selected fields.
CREATE TABLE qualys_ssl_labs_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    scan_status TEXT NOT NULL, -- e.g., 'COMPLETED', 'ERROR', 'IN_PROGRESS'
    grade TEXT, -- The primary grade for quick access
    scan_data JSONB, -- Stores the full/filtered JSON response from the user's selection
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add an index on application_id for faster lookups
CREATE INDEX idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);

-- Add an index on hostname for faster lookups
CREATE INDEX idx_qualys_scans_hostname ON qualys_ssl_labs_scans(hostname);

-- Add a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qualys_scans_updated_at
BEFORE UPDATE ON qualys_ssl_labs_scans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a comment to the table for documentation
COMMENT ON TABLE qualys_ssl_labs_scans IS 'Stores scan results from the Qualys SSL Labs integration, with a flexible JSONB column for user-defined data fields.';
