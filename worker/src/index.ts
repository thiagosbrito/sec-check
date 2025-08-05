#!/usr/bin/env node

import dotenv from 'dotenv';
import { worker } from './worker';
import './health'; // Import health server to start it

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('Starting SecCheck Security Scanner Worker...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Worker concurrency:', process.env.WORKER_CONCURRENCY || '2');
console.log('Redis URL:', process.env.REDIS_URL ? '[CONFIGURED]' : '[MISSING]');
console.log('Database URL:', process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]');

// The worker starts automatically when imported
console.log('Worker is ready and running');

// Wait for BullMQ worker to be ready
setTimeout(() => {
  console.log('✅ BullMQ worker initialization complete - ready for jobs');
}, 2000);

// Keep the process alive with a heartbeat interval
const heartbeat = setInterval(() => {
  console.log('Worker heartbeat - waiting for jobs...');
}, 30000); // Every 30 seconds

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  clearInterval(heartbeat);
  
  // Import and close worker properly
  const { worker } = await import('./worker');
  await worker.close();
  
  console.log('Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Keep process alive - this is crucial for Fly.io
console.log('Worker process staying alive with active event loop...');