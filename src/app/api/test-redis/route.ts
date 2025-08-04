import { NextResponse } from 'next/server';
import { getRedisConnection } from '@/lib/queue/connection';
import { addScanJob, getQueueHealth } from '@/lib/queue/queue';

export async function GET() {
  try {
    // Test Redis connection
    const redis = getRedisConnection();
    await redis.ping();
    
    // Test queue health
    const queueHealth = await getQueueHealth();
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful',
      data: {
        redis_status: 'connected',
        queue_health: queueHealth,
      },
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Redis connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Test adding a dummy job to the queue
    const testJob = await addScanJob({
      scanId: 'test-' + Date.now(),
      url: 'https://example.com',
      domain: 'example.com',
      userId: null,
      isPublicScan: true,
      scanConfig: {
        timeout: 30000,
        followRedirects: true,
        maxRedirects: 5,
        browserTimeout: 30000,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Test job added to queue successfully',
      data: {
        job_id: testJob.id,
        job_name: testJob.name,
        job_data: testJob.data,
      },
    });
  } catch (error) {
    console.error('Queue test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add test job to queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}