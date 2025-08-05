#!/usr/bin/env node

const { Queue } = require('bullmq');
const { Redis } = require('ioredis');
require('dotenv').config({ path: '.env' });

// Also try loading parent directory .env.local
require('dotenv').config({ path: '../.env.local' });

async function debugQueue() {
  console.log('🔍 Debugging BullMQ Queue Connection...\n');
  
  // Check all possible Redis env vars
  console.log('Environment variables:');
  console.log('REDIS_URL:', process.env.REDIS_URL);
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('REDIS')));
  
  // Use fallback if not found
  const redisUrl = process.env.REDIS_URL || "rediss://default:ASR6AAIjcDE1ZTVmNmQzMWNhNTg0Mzk4YjgwMjhlOWI2ZDEzMDk5NXAxMA@advanced-frog-9338.upstash.io:6379";
  console.log('Using Redis URL:', redisUrl);
  
  let processedRedisUrl = redisUrl;
  if (redisUrl.startsWith('redis://') && redisUrl.includes('upstash.io')) {
    processedRedisUrl = redisUrl.replace('redis://', 'rediss://');
  }
  
  const redisOptions = {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: false,
    connectTimeout: 10000,
    commandTimeout: 30000,
    retryDelayOnFailover: 100,
  };
  
  if (processedRedisUrl.includes('upstash.io')) {
    redisOptions.tls = {
      rejectUnauthorized: false,
    };
  }
  
  const redis = new Redis(processedRedisUrl, redisOptions);
  
  try {
    // Test Redis connection
    console.log('✅ Testing Redis connection...');
    await redis.ping();
    console.log('✅ Redis connection successful\n');
    
    // Create queue instance
    const queue = new Queue('security-scan', { connection: redis });
    
    // Get queue status
    console.log('📊 Queue Status:');
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();
    
    console.log(`  Waiting: ${waiting.length}`);
    console.log(`  Active: ${active.length}`);
    console.log(`  Completed: ${completed.length}`);
    console.log(`  Failed: ${failed.length}\n`);
    
    // List waiting jobs
    if (waiting.length > 0) {
      console.log('🔍 Waiting Jobs:');
      for (const job of waiting) {
        console.log(`  Job ID: ${job.id}`);
        console.log(`  Job Name: ${job.name}`);
        console.log(`  Job Data:`, JSON.stringify(job.data, null, 2));
        console.log(`  Created: ${new Date(job.timestamp).toISOString()}\n`);
      }
    }
    
    // List active jobs
    if (active.length > 0) {
      console.log('⚡ Active Jobs:');
      for (const job of active) {
        console.log(`  Job ID: ${job.id}`);
        console.log(`  Job Name: ${job.name}`);
        console.log(`  Progress: ${job.progress}`);
      }
    }
    
    // Check failed jobs
    if (failed.length > 0) {
      console.log('❌ Failed Jobs:');
      for (const job of failed) {
        console.log(`  Job ID: ${job.id}`);
        console.log(`  Job Name: ${job.name}`);
        console.log(`  Error: ${job.failedReason}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await redis.quit();
    console.log('Connection closed');
  }
}

debugQueue();