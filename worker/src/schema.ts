import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const scanStatusEnum = pgEnum('scan_status', [
  'pending',
  'running', 
  'completed',
  'failed',
  'cancelled'
]);

export const vulnerabilitySeverityEnum = pgEnum('vulnerability_severity', [
  'critical',
  'high',
  'medium',
  'low',
  'info'
]);

export const owaspCategoryEnum = pgEnum('owasp_category', [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'
]);

// Scans table
export const scans = pgTable('scans', {
  id: uuid('id').primaryKey(),
  url: varchar('url', { length: 2048 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  userId: uuid('user_id'),
  status: scanStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isPublicScan: boolean('is_public_scan').notNull().default(true),
  scanConfig: jsonb('scan_config'),
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  totalVulnerabilities: integer('total_vulnerabilities').default(0),
  criticalCount: integer('critical_count').default(0),
  highCount: integer('high_count').default(0),
  mediumCount: integer('medium_count').default(0),
  lowCount: integer('low_count').default(0),
  infoCount: integer('info_count').default(0),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
});

// Scan results table
export const scanResults = pgTable('scan_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').notNull().references(() => scans.id, { onDelete: 'cascade' }),
  testName: varchar('test_name', { length: 100 }).notNull(),
  owaspCategory: owaspCategoryEnum('owasp_category').notNull(),
  severity: vulnerabilitySeverityEnum('severity').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  impact: text('impact'),
  recommendation: text('recommendation'),
  evidence: jsonb('evidence'),
  technicalDetails: jsonb('technical_details'),
  references: jsonb('references'),
  confidence: integer('confidence').default(100),
  falsePositive: boolean('false_positive').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Reports table
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').notNull().references(() => scans.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 20 }).notNull().default('json'), // 'json', 'pdf', 'html'
  
  // Report content
  summary: jsonb('summary'), // executive summary, scores, etc.
  content: jsonb('content'), // full report data
  
  // Metadata
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  version: varchar('version', { length: 10 }).default('1.0'),
  
  // File storage (for PDF/HTML reports)
  fileUrl: varchar('file_url', { length: 500 }),
  fileSize: integer('file_size'),
  
  // Branding (for pro/enterprise)
  isCustomBranded: boolean('is_custom_branded').default(false),
  brandingConfig: jsonb('branding_config'),
});