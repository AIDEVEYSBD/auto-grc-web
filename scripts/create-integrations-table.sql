-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('connected', 'warning', 'disconnected')),
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    datapoints INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample integration data
INSERT INTO integrations (category, name, status, last_sync, datapoints) VALUES
('Cloud Security', 'AWS Security Hub', 'connected', NOW() - INTERVAL '2 hours', 1250),
('Cloud Security', 'Azure Security Center', 'connected', NOW() - INTERVAL '4 hours', 890),
('Cloud Security', 'Google Cloud Security Command Center', 'warning', NOW() - INTERVAL '1 day', 650),
('SIEM', 'Splunk Enterprise', 'connected', NOW() - INTERVAL '30 minutes', 5420),
('SIEM', 'IBM QRadar', 'disconnected', NOW() - INTERVAL '3 days', 0),
('SIEM', 'Microsoft Sentinel', 'connected', NOW() - INTERVAL '1 hour', 3200),
('Vulnerability Management', 'Qualys VMDR', 'connected', NOW() - INTERVAL '6 hours', 2100),
('Vulnerability Management', 'Rapid7 InsightVM', 'warning', NOW() - INTERVAL '12 hours', 1800),
('Vulnerability Management', 'Tenable.io', 'connected', NOW() - INTERVAL '3 hours', 1950),
('Identity & Access', 'Okta', 'connected', NOW() - INTERVAL '1 hour', 850),
('Identity & Access', 'Azure Active Directory', 'connected', NOW() - INTERVAL '2 hours', 1200),
('Identity & Access', 'CyberArk', 'warning', NOW() - INTERVAL '8 hours', 450),
('Endpoint Security', 'CrowdStrike Falcon', 'connected', NOW() - INTERVAL '45 minutes', 3800),
('Endpoint Security', 'SentinelOne', 'connected', NOW() - INTERVAL '1 hour', 2900),
('Endpoint Security', 'Carbon Black', 'disconnected', NOW() - INTERVAL '2 days', 0),
('Network Security', 'Palo Alto Prisma', 'connected', NOW() - INTERVAL '2 hours', 1600),
('Network Security', 'Fortinet FortiGate', 'warning', NOW() - INTERVAL '6 hours', 1100),
('Network Security', 'Cisco ASA', 'connected', NOW() - INTERVAL '4 hours', 950),
('Compliance', 'Rapid7 InsightCloudSec', 'connected', NOW() - INTERVAL '3 hours', 750),
('Compliance', 'Prisma Cloud', 'connected', NOW() - INTERVAL '1 hour', 1350),
('Data Security', 'Varonis', 'warning', NOW() - INTERVAL '10 hours', 680),
('Data Security', 'Microsoft Purview', 'connected', NOW() - INTERVAL '2 hours', 920);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_integrations_category ON integrations(category);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
