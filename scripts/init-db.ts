import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_5JvTYjQGt6HL@ep-super-glitter-ahuul9vd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function initDb() {
  const sql = neon(DATABASE_URL);

  console.log('Creating tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'owner',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      mechanism VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sections (
      id SERIAL PRIMARY KEY,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT DEFAULT '',
      page_limit INTEGER NOT NULL,
      page_count INTEGER DEFAULT 0,
      required_headings JSONB,
      is_valid BOOLEAN DEFAULT FALSE,
      is_complete BOOLEAN DEFAULT FALSE,
      order_index INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      name VARCHAR(255) NOT NULL,
      file_url TEXT,
      required BOOLEAN DEFAULT TRUE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS validation_results (
      id SERIAL PRIMARY KEY,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      errors JSONB,
      warnings JSONB,
      is_valid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('Database initialized successfully!');
}

initDb().catch(console.error);
