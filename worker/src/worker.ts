import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { scans, scanResults } from './schema';
import { eq } from 'drizzle-orm';
import { SecurityScanner } from './scanner';
import type { ScanJobData, ScanJobResult, ScanJobProgress } from './types';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Redis connection
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}

// Ensure TLS for Upstash
let processedRedisUrl = redisUrl;
if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
  processedRedisUrl = redisUrl.replace('redis://', 'rediss://');
}

const redis = new Redis(processedRedisUrl, {
  enableReadyCheck: false,
  maxRetriesPerRequest: null, // Required for BullMQ workers
  lazyConnect: false,
  connectTimeout: 10000,
  commandTimeout: 5000,
  tls: {}, // Empty TLS object for Upstash
});

// Test Redis connection
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

// Worker configuration
const worker = new Worker<ScanJobData, ScanJobResult>(
  'security-scan',
  async (job: Job<ScanJobData, ScanJobResult>) => {
    console.log(`Processing scan job ${job.id} for URL: ${job.data.url}`);
    
    try {
      // Update scan status to running
      await db
        .update(scans)
        .set({
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(scans.id, job.data.scanId));

      // Create scanner with progress callback
      const scanner = new SecurityScanner((progress: ScanJobProgress) => {
        job.updateProgress(progress);
      });

      // Run the security scan
      const result = await scanner.scan(job.data);

      // Store results in database
      await storeResults(result);

      // Update scan status
      await db
        .update(scans)
        .set({
          status: result.status === 'completed' ? 'completed' : 'failed',
          completedAt: new Date(),
          totalVulnerabilities: result.totalVulnerabilities,
          criticalCount: result.criticalCount,
          highCount: result.highCount,
          mediumCount: result.mediumCount,
          lowCount: result.lowCount,
          infoCount: result.infoCount,
          errorMessage: result.error || null,
        })
        .where(eq(scans.id, job.data.scanId));

      console.log(`Completed scan job ${job.id} with ${result.totalVulnerabilities} vulnerabilities found`);
      return result;

    } catch (error) {
      console.error(`Scan job ${job.id} failed:`, error);
      
      // Update scan status to failed
      await db
        .update(scans)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(scans.id, job.data.scanId));

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'), // Process 2 jobs concurrently
    removeOnComplete: { count: 10 }, // Keep last 10 completed jobs
    removeOnFail: { count: 20 },     // Keep last 20 failed jobs
  }
);

// Start the worker
console.log('Starting BullMQ worker...');
worker.run();

// Store scan results in database
async function storeResults(result: ScanJobResult): Promise<void> {
  if (result.results.length === 0) {
    return;
  }

  const resultsToInsert = result.results.map(testResult => ({
    scanId: result.scanId,
    testName: testResult.testName,
    owaspCategory: testResult.owaspCategory,
    severity: testResult.severity,
    status: testResult.status,
    title: testResult.title,
    description: testResult.description,
    impact: testResult.impact || null,
    recommendation: testResult.recommendation || null,
    evidence: testResult.evidence || null,
    technicalDetails: testResult.technicalDetails || null,
    references: testResult.references || null,
    confidence: testResult.confidence || 100,
  }));

  await db.insert(scanResults).values(resultsToInsert);
}

// Worker event handlers
worker.on('ready', () => {
  console.log('Security scan worker is ready and waiting for jobs');
});

worker.on('active', (job) => {
  console.log(`Worker processing job ${job.id}`);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with ${result.totalVulnerabilities} vulnerabilities`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  try {
    console.log('Closing BullMQ worker...');
    await worker.close();
    
    console.log('Closing Redis connection...');
    await redis.quit();
    
    console.log('Closing database connection...');
    await sql.end();
    
    console.log('Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { worker };