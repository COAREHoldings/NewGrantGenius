-- Phase 1: Add Architecture Layer Columns (Additive Only)
-- Safe migration: adds JSONB columns without modifying existing data

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS architecture_jsonb JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dependency_map_jsonb JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS score_jsonb JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risk_jsonb JSONB DEFAULT '{}';

-- Add index for architecture queries
CREATE INDEX IF NOT EXISTS idx_sections_architecture ON sections USING GIN (architecture_jsonb);

COMMENT ON COLUMN sections.architecture_jsonb IS 'Architecture-first design: aims, hypotheses, endpoints';
COMMENT ON COLUMN sections.dependency_map_jsonb IS 'Dependency graph between aims';
COMMENT ON COLUMN sections.score_jsonb IS 'Structural scoring results';
COMMENT ON COLUMN sections.risk_jsonb IS 'Risk analysis results';
