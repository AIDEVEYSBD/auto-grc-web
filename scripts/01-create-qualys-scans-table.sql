-- Create the qualys_ssl_labs_scans table
CREATE TABLE IF NOT EXISTS qualys_ssl_labs_scans (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL,
    scan_data JSONB NOT NULL,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_hostname ON qualys_ssl_labs_scans(hostname);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_scan_date ON qualys_ssl_labs_scans(scan_date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_qualys_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_qualys_scans_updated_at ON qualys_ssl_labs_scans;
CREATE TRIGGER update_qualys_scans_updated_at
    BEFORE UPDATE ON qualys_ssl_labs_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_qualys_scans_updated_at();
