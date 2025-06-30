-- Create capabilities table
CREATE TABLE IF NOT EXISTS capabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample capability data
INSERT INTO capabilities (name, description, is_enabled) VALUES
('Framework Baseliner', 'Allows users to initiate and track framework-to-framework mapping in your GRC system. Streamline compliance by establishing baseline mappings between different regulatory frameworks and standards.', TRUE),
('SOC Mapper', 'Maps SOC2 Type2 report against selected framework. Automatically analyze your SOC2 compliance reports and map findings to your chosen compliance framework for comprehensive coverage analysis.', FALSE),
('Controls Automation', 'Automatically assesses certain controls of the Master Framework for various applications and stores their details. Reduce manual effort by automating control assessments across your application portfolio.', FALSE),
('Risk Assessment Engine', 'Automated risk scoring and assessment based on compliance gaps and security findings across your infrastructure.', TRUE),
('Continuous Monitoring', 'Real-time monitoring of compliance status with automated alerts for policy violations and control failures.', TRUE),
('Audit Trail Manager', 'Comprehensive audit logging and reporting for compliance evidence collection and regulatory reporting.', FALSE),
('Policy Engine', 'Centralized policy management with automated enforcement across cloud and on-premises environments.', FALSE),
('Incident Response Automation', 'Automated incident response workflows triggered by compliance violations and security events.', TRUE);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_capabilities_enabled ON capabilities(is_enabled);
