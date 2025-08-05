import { Redis } from 'ioredis';

// Get Redis URL with proper TLS format
const getRedisUrl = (): string => {
  let redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }
  
  // Ensure we use rediss:// for TLS (Upstash requirement)
  if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
    redisUrl = redisUrl.replace('redis://', 'rediss://');
  }
  
  return redisUrl;
};

// Create Redis connection for BullMQ producers (API endpoints)
export const createRedisConnection = (): Redis => {
  const redisUrl = getRedisUrl();
  
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1, // Low retries for producers
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    tls: {}, // Empty TLS object for Upstash
  });

  // Minimal error logging
  redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
  });

  return redis;
};

// Create Redis connection for BullMQ workers
export const createWorkerRedisConnection = (): Redis => {
  const redisUrl = getRedisUrl();
  
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ workers
    enableReadyCheck: false,
    lazyConnect: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
    tls: {}, // Empty TLS object for Upstash
  });

  redis.on('error', (error) => {
    console.error('Worker Redis error:', error.message);
  });

  return redis;
};

// Singleton Redis connection for the application
let redisInstance: Redis | null = null;

export const getRedisConnection = (): Redis => {
  if (!redisInstance) {
    redisInstance = createRedisConnection();
  }
  return redisInstance;
};

// Close Redis connection (for cleanup)
export const closeRedisConnection = async (): Promise<void> => {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
};