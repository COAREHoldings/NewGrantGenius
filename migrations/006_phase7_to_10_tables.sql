-- Phase 7: Reviewer Simulations Table
CREATE TABLE IF NOT EXISTS reviewer_simulations (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  section_id INTEGER REFERENCES sections(id),
  persona VARCHAR(100) NOT NULL,
  critique JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviewer_simulations_app ON reviewer_simulations(application_id);

-- Phase 9: Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  fiscal_year INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  justification TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_app ON budgets(application_id);

-- Phase 10: Grant Opportunities Table
CREATE TABLE IF NOT EXISTS grant_opportunities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  foa_number VARCHAR(50),
  title TEXT NOT NULL,
  agency VARCHAR(100),
  deadline TIMESTAMP,
  funding_amount DECIMAL(12,2),
  description TEXT,
  url TEXT,
  saved_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grant_opportunities_user ON grant_opportunities(user_id);

-- Phase 10: References Table
CREATE TABLE IF NOT EXISTS research_references (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  application_id INTEGER REFERENCES applications(id),
  pmid VARCHAR(20),
  doi VARCHAR(100),
  title TEXT NOT NULL,
  authors TEXT,
  journal VARCHAR(255),
  year INTEGER,
  citation_text TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_references_user ON research_references(user_id);
CREATE INDEX IF NOT EXISTS idx_references_app ON research_references(application_id);
