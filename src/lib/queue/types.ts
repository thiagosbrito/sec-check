import { z } from 'zod';
import type { NewScan, NewScanResult } from '@/lib/db/schema';

// Job data schema - uses the same structure as our database
export const scanJobSchema = z.object({
  scanId: z.string().uuid(),
  url: z.string().url(),
  domain: z.string(),
  userId: z.string().uuid().nullable(),
  isPublicScan: z.boolean(),
  scanConfig: z.object({
    timeout: z.number().min(1000).max(300000).default(30000),
    userAgent: z.string().optional(),
    followRedirects: z.boolean().default(true),
    maxRedirects: z.number().min(0).max(10).default(5),
    browserTimeout: z.number().min(5000).max(60000).default(30000),
  }).optional(),
});

// Job progress tracking
export type ScanJobProgress = {
  stage: 'initializing' | 'analyzing' | 'testing' | 'reporting' | 'completed';
  completedTests: number;
  totalTests: number;
  currentTest?: string;
  message?: string;
  percentage: number;
};

// Job result
export type ScanJobResult = {
  scanId: string;
  status: 'completed' | 'failed' | 'partial';
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  executionTime: number;
  error?: string;
  results: NewScanResult[];
};

// Use existing schema types
export type ScanJobData = z.infer<typeof scanJobSchema>;

// Queue configuration
export const QUEUE_NAMES = {
  SECURITY_SCAN: 'security-scan',
} as const;

export const JOB_TYPES = {
  SECURITY_SCAN: 'security-scan',
} as const;