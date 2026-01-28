-- Version History Table
CREATE TABLE IF NOT EXISTS section_versions (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_section_versions_section ON section_versions(section_id);
CREATE INDEX IF NOT EXISTS idx_section_versions_created ON section_versions(created_at DESC);

-- Collaborators Table
CREATE TABLE IF NOT EXISTS collaborators (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(application_id, email)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_app ON collaborators(application_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);

-- Update attachments table to support file URLs
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;
