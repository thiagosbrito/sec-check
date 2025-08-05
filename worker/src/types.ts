// Security test result type
export type SecurityTestResult = {
  testName: string;
  owaspCategory: 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07' | 'A08' | 'A09' | 'A10';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'pass' | 'fail' | 'warning' | 'error';
  title: string;
  description: string;
  impact?: string;
  recommendation?: string;
  evidence?: Record<string, any>;
  technicalDetails?: Record<string, any>;
  references?: string[];
  confidence?: number;
};

// Job data types (matching main app)
export type ScanJobData = {
  scanId: string;
  url: string;
  domain: string;
  userId: string | null;
  isPublicScan: boolean;
  scanConfig?: {
    timeout?: number;
    userAgent?: string;
    followRedirects?: boolean;
    maxRedirects?: number;
    browserTimeout?: number;
  };
};

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
  results: SecurityTestResult[];
};