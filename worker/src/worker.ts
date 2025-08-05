import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { scans, scanResults } from './schema';
import { eq } from 'drizzle-orm';
import { SecurityScanner } from './scanner';
import type { ScanJobData, ScanJobResult, ScanJobProgress } from './types';

import dotenv from 'dotenv';

// Queue configuration constants (should match API)
const QUEUE_NAME = 'security-scan';
const JOB_NAME = 'security-scan';

// Load environment variables first
dotenv.config();

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

// Handle both Upstash and Railway Redis URLs
let processedRedisUrl = redisUrl;
if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
  processedRedisUrl = redisUrl.replace('redis://', 'rediss://');
} else if (redisUrl.includes('railway.internal')) {
  // Fix for Railway Redis - force IPv4 for ioredis
  processedRedisUrl = redisUrl + '?family=0';
}

// Configure Redis connection options based on URL
const redisOptions: any = {
  enableReadyCheck: false,
  maxRetriesPerRequest: null, // Required for BullMQ workers
  lazyConnect: false,
  connectTimeout: 10000,
  commandTimeout: 30000,
  retryDelayOnFailover: 100,
};

// Add TLS for Upstash URLs (Railway Redis typically doesn't need TLS)
if (processedRedisUrl.includes('upstash.io')) {
  redisOptions.tls = {
    rejectUnauthorized: false, // Important for Upstash
  };
}

const redis = new Redis(processedRedisUrl, redisOptions);

// Test Redis connection
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', (ms: number) => {
  console.log(`Redis reconnecting in ${ms}ms`);
});

// Test Redis connection with a simple ping
redis.ping().then(() => {
  console.log('Redis ping successful');
}).catch((error) => {
  console.error('Redis ping failed:', error);
});

// Worker configuration  
const worker = new Worker<ScanJobData, ScanJobResult>(
  QUEUE_NAME,
  async (job: Job<ScanJobData, ScanJobResult>) => {
    console.log(`📋 Worker received job ${job.id} (name: "${job.name}") for URL: ${job.data.url}`);
    
    // Verify job name matches expected pattern
    if (job.name !== JOB_NAME) {
      console.warn(`⚠️  Unexpected job name: "${job.name}", expected: "${JOB_NAME}"`);
    }
    
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

// Worker starts automatically when created
console.log('BullMQ worker created and starting...');
console.log(`Worker will process jobs from queue: "${QUEUE_NAME}"`);
console.log(`Redis URL: ${processedRedisUrl}`);

// Add debugging: Use BullMQ Queue methods instead of raw Redis
setTimeout(async () => {
  try {
    // Import Queue for status checking
    const { Queue } = await import('bullmq');
    const statusQueue = new Queue('security-scan', { connection: redis });
    
    const waiting = await statusQueue.getWaiting();
    const active = await statusQueue.getActive();
    const completed = await statusQueue.getCompleted();
    const failed = await statusQueue.getFailed();
    
    console.log(`📊 Queue status - Waiting: ${waiting.length}, Active: ${active.length}, Completed: ${completed.length}, Failed: ${failed.length}`);
    
    // Check if there are specific job IDs waiting
    if (waiting.length > 0) {
      const jobIds = waiting.map(job => job.id);
      console.log(`🔍 Jobs waiting in queue: ${jobIds.join(', ')}`);
    }
    
    await statusQueue.close();
  } catch (error) {
    console.error('Failed to check queue status:', error);
  }
}, 5000);

// Also add a periodic check to see if worker is actually polling
setInterval(async () => {
  try {
    const { Queue } = await import('bullmq');
    const statusQueue = new Queue('security-scan', { connection: redis });
    
    const waiting = await statusQueue.getWaiting();
    if (waiting.length > 0) {
      console.log(`⏳ ${waiting.length} jobs still waiting to be processed...`);
    }
    
    await statusQueue.close();
  } catch (error) {
    console.error('Periodic queue check failed:', error);
  }
}, 30000); // Check every 30 seconds

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
  console.log('✅ Security scan worker is ready and waiting for jobs');
  console.log(`Worker listening on queue: "${QUEUE_NAME}"`);
  
  // Notify health check that worker is ready
  import('./health').then(({ setWorkerReady }) => {
    setWorkerReady(worker);
  });
});

worker.on('active', (job) => {
  console.log(`🔄 Worker started processing job ${job.id} (${job.name})`);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed with ${result.totalVulnerabilities} vulnerabilities`);
});

// Add additional debugging events
worker.on('stalled', (jobId) => {
  console.log(`⚠️  Job ${jobId} stalled`);
});

worker.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${JSON.stringify(progress)}`);
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