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
  index,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

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
  'A01', // Broken Access Control
  'A02', // Cryptographic Failures  
  'A03', // Injection
  'A04', // Insecure Design
  'A05', // Security Misconfiguration
  'A06', // Vulnerable Components
  'A07', // Identification and Authentication Failures
  'A08', // Software and Data Integrity Failures
  'A09', // Security Logging and Monitoring Failures
  'A10'  // Server-Side Request Forgery
]);

export const userPlanEnum = pgEnum('user_plan', [
  'free',
  'pro', 
  'enterprise'
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Use Supabase Auth UUID, don't auto-generate
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  plan: userPlanEnum('plan').notNull().default('free'),
  scanLimit: integer('scan_limit').notNull().default(1), // scans per day/month based on plan
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  planIdx: index('users_plan_idx').on(table.plan),
}));

// Domains table for verification
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationMethod: varchar('verification_method', { length: 50 }), // 'file' | 'dns'
  verificationToken: varchar('verification_token', { length: 255 }),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  domainIdx: index('domains_domain_idx').on(table.domain),
  userIdx: index('domains_user_idx').on(table.userId),
  verifiedIdx: index('domains_verified_idx').on(table.isVerified),
}));

// Scans table
export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: varchar('url', { length: 2048 }).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: scanStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Scan configuration
  isPublicScan: boolean('is_public_scan').notNull().default(true), // false for verified domains
  scanConfig: jsonb('scan_config'), // additional scan parameters
  
  // Metadata
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  
  // Results summary
  totalVulnerabilities: integer('total_vulnerabilities').default(0),
  criticalCount: integer('critical_count').default(0),
  highCount: integer('high_count').default(0),
  mediumCount: integer('medium_count').default(0),
  lowCount: integer('low_count').default(0),
  infoCount: integer('info_count').default(0),
  
  // Error handling
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
}, (table) => ({
  urlIdx: index('scans_url_idx').on(table.url),
  domainIdx: index('scans_domain_idx').on(table.domain), 
  userIdx: index('scans_user_idx').on(table.userId),
  statusIdx: index('scans_status_idx').on(table.status),
  createdAtIdx: index('scans_created_at_idx').on(table.createdAt),
  publicIdx: index('scans_public_idx').on(table.isPublicScan),
}));

// Scan results table - stores individual test results
export const scanResults = pgTable('scan_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').notNull().references(() => scans.id, { onDelete: 'cascade' }),
  testName: varchar('test_name', { length: 100 }).notNull(), // e.g., 'security_headers', 'xss_test'
  owaspCategory: owaspCategoryEnum('owasp_category').notNull(),
  severity: vulnerabilitySeverityEnum('severity').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pass', 'fail', 'warning', 'error'
  
  // Test details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  impact: text('impact'),
  recommendation: text('recommendation'),
  
  // Technical details
  evidence: jsonb('evidence'), // URLs, headers, response snippets, etc.
  technicalDetails: jsonb('technical_details'), // request/response, code snippets
  references: jsonb('references'), // OWASP links, CVE numbers, etc.
  
  // Metadata
  confidence: integer('confidence').default(100), // 0-100 confidence in finding
  falsePositive: boolean('false_positive').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  scanIdx: index('scan_results_scan_idx').on(table.scanId),
  testIdx: index('scan_results_test_idx').on(table.testName),
  owaspIdx: index('scan_results_owasp_idx').on(table.owaspCategory),
  severityIdx: index('scan_results_severity_idx').on(table.severity),
  statusIdx: index('scan_results_status_idx').on(table.status),
}));

// Reports table - generated reports for scans
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
}, (table) => ({
  scanIdx: index('reports_scan_idx').on(table.scanId),
  formatIdx: index('reports_format_idx').on(table.format),
  generatedAtIdx: index('reports_generated_at_idx').on(table.generatedAt),
}));

// API Keys table for API access
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyId: varchar('key_id', { length: 50 }).notNull().unique().$defaultFn(() => createId()),
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // hashed API key
  name: varchar('name', { length: 100 }).notNull(),
  
  // Permissions and limits
  isActive: boolean('is_active').notNull().default(true),
  rateLimit: integer('rate_limit').default(60), // requests per hour
  
  // Usage tracking
  lastUsedAt: timestamp('last_used_at'),
  usageCount: integer('usage_count').default(0),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  userIdx: index('api_keys_user_idx').on(table.userId),
  keyIdIdx: index('api_keys_key_id_idx').on(table.keyId),
  activeIdx: index('api_keys_active_idx').on(table.isActive),
}));

// Usage tracking table for rate limiting and analytics
export const usageStats = pgTable('usage_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  
  // Daily counters
  scansCount: integer('scans_count').default(0),
  apiCallsCount: integer('api_calls_count').default(0),
  
  // Plan tracking
  planAtTime: userPlanEnum('plan_at_time').notNull(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userDateIdx: index('usage_stats_user_date_idx').on(table.userId, table.date),
  dateIdx: index('usage_stats_date_idx').on(table.date),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type ScanResult = typeof scanResults.$inferSelect;
export type NewScanResult = typeof scanResults.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type UsageStats = typeof usageStats.$inferSelect;
export type NewUsageStats = typeof usageStats.$inferInsert;