import { Queue, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES, type ScanJobData, type ScanJobResult } from './types';

// Create dedicated Redis connection for BullMQ (same config as worker)
const redisUrl = process.env.REDIS_URL!;

// Handle both Upstash and Railway Redis URLs
let processedRedisUrl = redisUrl;
if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
  processedRedisUrl = redisUrl.replace('redis://', 'rediss://');
}

// Configure Redis options (match worker exactly)
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

// Queue configuration
const queueConfig: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 20,     // Keep last 20 failed jobs for debugging
  },
};

// Security scan queue
export const securityScanQueue = new Queue<ScanJobData, ScanJobResult>(
  QUEUE_NAMES.SECURITY_SCAN,
  queueConfig
);

// Add job to security scan queue
export const addScanJob = async (
  jobData: ScanJobData,
  options?: {
    priority?: number;
    delay?: number;
  }
) => {
  return await securityScanQueue.add(
    'security-scan',
    jobData,
    {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
    }
  );
};

// Get job status
export const getScanJobStatus = async (jobId: string) => {
  const job = await securityScanQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    data: job.data,
    progress: job.progress,
    state: await job.getState(),
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    failedReason: job.failedReason,
    returnvalue: job.returnvalue,
  };
};

// Clean up old jobs
export const cleanQueue = async () => {
  await securityScanQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean completed jobs older than 24 hours
  await securityScanQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');  // Clean failed jobs older than 7 days
};

// Queue health check
export const getQueueHealth = async () => {
  const waiting = await securityScanQueue.getWaiting();
  const active = await securityScanQueue.getActive();
  const completed = await securityScanQueue.getCompleted();
  const failed = await securityScanQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    total: waiting.length + active.length + completed.length + failed.length,
  };
};