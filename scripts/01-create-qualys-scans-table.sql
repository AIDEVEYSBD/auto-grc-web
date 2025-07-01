-- Create a table to store Qualys SSL Labs scan results
CREATE TABLE IF NOT EXISTS qualys_ssl_labs_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    scan_status TEXT NOT NULL,
    grade TEXT,
    scan_data JSONB,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on application_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);

-- Optional: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Optional: Create a trigger to call the function before any update
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'update_qualys_scans_updated_at'
   ) THEN
      CREATE TRIGGER update_qualys_scans_updated_at
      BEFORE UPDATE ON qualys_ssl_labs_scans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
   END IF;
END
$$;
