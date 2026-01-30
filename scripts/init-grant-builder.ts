import { neon } from '@neondatabase/serverless';
const DATABASE_URL = "postgresql://neondb_owner:npg_5JvTYjQGt6HL@ep-super-glitter-ahuul9vd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function initGrantBuilder() {
  const sql = neon(DATABASE_URL);
  console.log('Creating grant builder tables...');
  
  // Grants table
  await sql`
    CREATE TABLE IF NOT EXISTS grants (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT,
      disease_area TEXT,
      biological_target TEXT,
      mechanism VARCHAR(50) DEFAULT 'r01',
      status VARCHAR(50) DEFAULT 'draft',
      gap_statement TEXT,
      impact_paragraph TEXT,
      hypothesis TEXT,
      hypothesis_mechanism TEXT,
      hypothesis_clinical TEXT,
      score_significance DECIMAL,
      score_innovation DECIMAL,
      score_approach DECIMAL,
      score_investigator DECIMAL,
      score_environment DECIMAL,
      score_commercial DECIMAL,
      fundability_score DECIMAL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Grant aims
  await sql`
    CREATE TABLE IF NOT EXISTS grant_aims (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
      aim_number INTEGER NOT NULL,
      scientific_question TEXT,
      expected_outcome TEXT,
      experimental_model TEXT,
      hypothesis_link TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Collaborators
  await sql`
    CREATE TABLE IF NOT EXISTS grant_collaborators (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role VARCHAR(100) NOT NULL,
      expertise TEXT,
      institution TEXT,
      effort_percent DECIMAL,
      aim_ids TEXT[],
      letter_status VARCHAR(50) DEFAULT 'pending',
      letter_due_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Experiments (approach)
  await sql`
    CREATE TABLE IF NOT EXISTS grant_experiments (
      id SERIAL PRIMARY KEY,
      aim_id INTEGER NOT NULL REFERENCES grant_aims(id) ON DELETE CASCADE,
      design TEXT,
      controls TEXT,
      statistical_plan TEXT,
      anticipated_results TEXT,
      pitfalls TEXT,
      alternatives TEXT,
      timeline_weeks INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Preliminary data
  await sql`
    CREATE TABLE IF NOT EXISTS grant_preliminary_data (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
      data_type VARCHAR(100),
      description TEXT,
      aim_ids TEXT[],
      supports_feasibility BOOLEAN DEFAULT FALSE,
      supports_mechanism BOOLEAN DEFAULT FALSE,
      derisks_translation BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Figures
  await sql`
    CREATE TABLE IF NOT EXISTS grant_figures (
      id SERIAL PRIMARY KEY,
      grant_id INTEGER NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
      figure_type VARCHAR(100),
      title TEXT,
      description TEXT,
      layout_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('Grant builder tables created!');
}

initGrantBuilder().catch(console.error);
