import { pgTable, serial, text, timestamp, integer, boolean, json, varchar, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('owner'),
  createdAt: timestamp('created_at').defaultNow()
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  mechanism: varchar('mechanism', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Architecture types for JSONB columns
export interface ArchitectureData {
  aims?: Array<{
    id: string;
    title: string;
    hypothesis: string;
    isFalsifiable: boolean;
    endpoints: string[];
    rationale?: string;
  }>;
  centralHypothesis?: string;
  innovationStatement?: string;
  lastUpdated?: string;
}

export interface DependencyMapData {
  dependencies?: Array<{
    fromAimId: string;
    toAimId: string;
    type: 'sequential' | 'parallel' | 'conditional';
    description?: string;
  }>;
  dominoRisk?: number;
}

export interface ScoreData {
  structuralScore?: number;
  completeness?: number;
  coherence?: number;
  falsifiability?: number;
  lastCalculated?: string;
}

export interface RiskData {
  flags?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    aimId?: string;
  }>;
  overallRisk?: 'low' | 'medium' | 'high' | 'critical';
  lastAnalyzed?: string;
}

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').default(''),
  pageLimit: integer('page_limit').notNull(),
  pageCount: integer('page_count').default(0),
  requiredHeadings: json('required_headings').$type<string[]>(),
  isValid: boolean('is_valid').default(false),
  isComplete: boolean('is_complete').default(false),
  orderIndex: integer('order_index').notNull(),
  // Phase 1: Architecture-First columns (additive only)
  architectureJsonb: json('architecture_jsonb').$type<ArchitectureData>().default({}),
  dependencyMapJsonb: json('dependency_map_jsonb').$type<DependencyMapData>().default({}),
  scoreJsonb: json('score_jsonb').$type<ScoreData>().default({}),
  riskJsonb: json('risk_jsonb').$type<RiskData>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id),
  name: varchar('name', { length: 255 }).notNull(),
  fileUrl: text('file_url'),
  required: boolean('required').default(true),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow()
});

export const validationResults = pgTable('validation_results', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id),
  errors: json('errors').$type<string[]>(),
  warnings: json('warnings').$type<string[]>(),
  isValid: boolean('is_valid').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Publications Module Tables
export const publications = pgTable('publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull(),
  pmid: varchar('pmid', { length: 20 }),
  pmcid: varchar('pmcid', { length: 20 }),
  doi: varchar('doi', { length: 100 }),
  title: text('title').notNull(),
  authors: json('authors').$type<{ name: string; affiliation?: string; isCorresponding?: boolean }[]>().default([]),
  journal: varchar('journal', { length: 255 }),
  year: integer('year'),
  volume: varchar('volume', { length: 50 }),
  issue: varchar('issue', { length: 50 }),
  pages: varchar('pages', { length: 50 }),
  citationCount: integer('citation_count').default(0),
  abstract: text('abstract'),
  keywords: json('keywords').$type<string[]>().default([]),
  grantAcknowledgments: json('grant_acknowledgments').$type<string[]>().default([]),
  researchThemes: json('research_themes').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const manuscripts = pgTable('manuscripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull(),
  grantId: integer('grant_id'),
  title: text('title').notNull(),
  status: varchar('status', { length: 20 }).default('draft'),
  targetJournal: varchar('target_journal', { length: 255 }),
  coAuthors: json('co_authors').$type<{ name: string; affiliation?: string }[]>().default([]),
  content: json('content').$type<Record<string, string>>().default({}),
  submissionDate: timestamp('submission_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const researchProfiles = pgTable('research_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().unique(),
  totalPublications: integer('total_publications').default(0),
  hIndex: integer('h_index').default(0),
  totalCitations: integer('total_citations').default(0),
  topCitedWorks: json('top_cited_works').$type<unknown[]>().default([]),
  researchThemes: json('research_themes').$type<{ theme: string; count: number }[]>().default([]),
  collaborators: json('collaborators').$type<{ name: string; count: number }[]>().default([]),
  yearlyOutput: json('yearly_output').$type<{ year: number; count: number }[]>().default([]),
  biosketchSectionC: text('biosketch_section_c'),
  biosketchSectionD: text('biosketch_section_d'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Phase 7: Reviewer Simulations
export const reviewerSimulations = pgTable('reviewer_simulations', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id),
  sectionId: integer('section_id').references(() => sections.id),
  persona: varchar('persona', { length: 100 }).notNull(),
  critique: json('critique').$type<Record<string, unknown>>().default({}),
  score: integer('score'),
  createdAt: timestamp('created_at').defaultNow()
});

// Phase 9: Budgets
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => applications.id),
  fiscalYear: integer('fiscal_year').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  amount: integer('amount').notNull().default(0),
  justification: text('justification'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Phase 10: Grant Opportunities
export const grantOpportunities = pgTable('grant_opportunities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  foaNumber: varchar('foa_number', { length: 50 }),
  title: text('title').notNull(),
  agency: varchar('agency', { length: 100 }),
  deadline: timestamp('deadline'),
  fundingAmount: integer('funding_amount'),
  description: text('description'),
  url: text('url'),
  savedAt: timestamp('saved_at').defaultNow()
});

// Phase 10: Research References
export const researchReferences = pgTable('research_references', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  applicationId: integer('application_id').references(() => applications.id),
  pmid: varchar('pmid', { length: 20 }),
  doi: varchar('doi', { length: 100 }),
  title: text('title').notNull(),
  authors: text('authors'),
  journal: varchar('journal', { length: 255 }),
  year: integer('year'),
  citationText: text('citation_text'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

export type User = typeof users.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type ValidationResult = typeof validationResults.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type Manuscript = typeof manuscripts.$inferSelect;
export type ResearchProfile = typeof researchProfiles.$inferSelect;
export type ReviewerSimulation = typeof reviewerSimulations.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type GrantOpportunity = typeof grantOpportunities.$inferSelect;
export type ResearchReference = typeof researchReferences.$inferSelect;
