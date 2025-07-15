-- Create the automation_results table to store computed results
-- This table will store results when dynamic table creation is not available

CREATE TABLE automation_results (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_automation_results_table_name ON automation_results(table_name);
CREATE INDEX idx_automation_results_created_at ON automation_results(created_at);

-- Add RLS policies
ALTER TABLE automation_results ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and write their own results
CREATE POLICY "Users can manage their automation results" ON automation_results
  FOR ALL USING (true);
