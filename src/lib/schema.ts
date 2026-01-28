import { pgTable, serial, text, timestamp, integer, boolean, json, varchar } from 'drizzle-orm/pg-core';

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

export type User = typeof users.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type ValidationResult = typeof validationResults.$inferSelect;
