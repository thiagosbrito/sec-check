import { Queue, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES, type ScanJobData, type ScanJobResult } from './types';

// Create dedicated Redis connection for BullMQ (same config as worker)
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  lazyConnect: false, // Match worker exactly
  connectTimeout: 10000,
  commandTimeout: 5000,
  tls: {}, // Empty TLS object for Upstash
});

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