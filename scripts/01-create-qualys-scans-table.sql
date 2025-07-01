-- Create a table to store Qualys SSL Labs scan results
CREATE TABLE IF NOT EXISTS qualys_ssl_labs_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scan_data JSONB NOT NULL,
    grade VARCHAR(10),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_hostname ON qualys_ssl_labs_scans(hostname);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_scan_date ON qualys_ssl_labs_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_qualys_scans_grade ON qualys_ssl_labs_scans(grade);

-- Optional: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Optional: Create a trigger to call the function before any update
CREATE TRIGGER update_qualys_scans_updated_at 
    BEFORE UPDATE ON qualys_ssl_labs_scans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
