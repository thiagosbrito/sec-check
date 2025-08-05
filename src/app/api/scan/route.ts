import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { scans } from '@/lib/db/schema';
import { addScanJob } from '@/lib/queue/queue';
import { eq } from 'drizzle-orm';

// Request schema
const scanRequestSchema = z.object({
  url: z.url('Please provide a valid URL'),
  userId: z.uuid().optional(),
  isPublicScan: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = scanRequestSchema.parse(body);

    // Extract domain from URL
    const url = new URL(validatedData.url);
    const domain = url.hostname;

    // Validate URL protocol (only HTTP/HTTPS)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    // Check for localhost/private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const isLocalhost = domain === 'localhost' || 
                         domain === '127.0.0.1' || 
                         domain.startsWith('192.168.') ||
                         domain.startsWith('10.') ||
                         domain.startsWith('172.');
      
      if (isLocalhost) {
        return NextResponse.json(
          { error: 'Cannot scan local or private network addresses' },
          { status: 400 }
        );
      }
    }

    // Create scan record in database
    const [scan] = await db
      .insert(scans)
      .values({
        url: validatedData.url,
        domain,
        userId: validatedData.userId || null,
        isPublicScan: validatedData.isPublicScan,
        status: 'pending',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      })
      .returning({
        id: scans.id,
        url: scans.url,
        domain: scans.domain,
        status: scans.status,
        createdAt: scans.createdAt,
      });

    // Add job to scan queue
    const job = await addScanJob({
      scanId: scan.id,
      url: validatedData.url,
      domain,
      userId: validatedData.userId || null,
      isPublicScan: validatedData.isPublicScan,
      scanConfig: {
        timeout: 30000,
        followRedirects: true,
        maxRedirects: 5,
        browserTimeout: 30000,
      },
    });

    // Update scan with job ID (stored in scanConfig)
    await db
      .update(scans)
      .set({
        scanConfig: { jobId: job.id },
        status: 'pending',
      })
      .where(eq(scans.id, scan.id));

    return NextResponse.json({
      success: true,
      data: {
        scanId: scan.id,
        jobId: job.id,
        url: scan.url,
        domain: scan.domain,
        status: scan.status,
        createdAt: scan.createdAt,
        estimatedCompletionTime: '1-3 minutes',
      },
    });

  } catch (error) {
    console.error('Scan API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues.map(issue => issue.message),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Invalid URL')) {
      return NextResponse.json(
        { error: 'Please provide a valid URL' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Simple health check - verify database and queue connectivity
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        queue: 'connected',
      },
    };

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      },
      { status: 503 }
    );
  }
}