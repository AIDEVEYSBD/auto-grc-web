-- scripts/01-create-qualys-table.sql

-- Create the base table for Qualys SSL Labs assessments.
-- Columns will be added dynamically based on user selection during the integration setup.
CREATE TABLE IF NOT EXISTS qualys_ssl_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  assessment_status TEXT, -- To track status like 'READY', 'ERROR', 'IN_PROGRESS'
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_qualys_assessment_per_app UNIQUE (application_id)
);

COMMENT ON TABLE qualys_ssl_assessments IS 'Stores results from Qualys SSL Labs assessments. The schema is extended dynamically.';
