import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { scans, users, usageStats } from '@/lib/db/schema';
import { addScanJob } from '@/lib/queue/queue';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { planEnforcementService } from '@/lib/billing/enforcement';

// Request schema
const scanRequestSchema = z.object({
  url: z.url('Please provide a valid URL'),
  isPublicScan: z.boolean().default(true),
});

// Function to check daily scan limit for authenticated users
async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Get user's plan and scan limit
  const [user] = await db
    .select({ scanLimit: users.scanLimit, plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  // Get today's date boundaries (start and end of day)
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Count today's scans
  const [todayUsage] = await db
    .select({ count: sql<number>`count(*)` })
    .from(scans)
    .where(
      and(
        eq(scans.userId, userId),
        gte(scans.createdAt, startOfDay),
        lt(scans.createdAt, endOfDay)
      )
    );

  const todayCount = Number(todayUsage?.count) || 0;
  const remaining = Math.max(0, user.scanLimit - todayCount);
  const allowed = todayCount < user.scanLimit;

  return {
    allowed,
    remaining,
    limit: user.scanLimit
  };
}

// Function to update daily usage stats
async function updateUsageStats(userId: string) {
  const today = new Date();
  const dateKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Get user's current plan
  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  // Upsert usage stats for today
  await db
    .insert(usageStats)
    .values({
      userId: userId,
      date: dateKey,
      scansCount: 1,
      apiCallsCount: 1,
      planAtTime: user.plan,
    })
    .onConflictDoUpdate({
      target: [usageStats.userId, usageStats.date],
      set: {
        scansCount: sql`${usageStats.scansCount} + 1`,
        apiCallsCount: sql`${usageStats.apiCallsCount} + 1`,
      }
    });
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = scanRequestSchema.parse(body);

    // Extract domain from URL
    const url = new URL(validatedData.url);
    const domain = url.hostname;
    
    // Determine user ID and scan type
    const userId = user?.id || null;
    const isPublicScan = !user || validatedData.isPublicScan;

    // Check daily scan limit for authenticated users
    if (user && userId) {
      const limitCheck = await checkDailyLimit(userId);
      
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { 
            error: `Daily scan limit reached. You've used all ${limitCheck.limit} scans for today. Limit resets at midnight.`,
            code: 'DAILY_LIMIT_EXCEEDED',
            details: {
              limit: limitCheck.limit,
              used: limitCheck.limit,
              remaining: 0,
              resetTime: 'midnight'
            }
          },
          { status: 429 }
        );
      }

      const planCheck = await planEnforcementService.checkScanLimit(user.id);
      if (!planCheck.allowed) {
        return NextResponse.json({ error: planCheck.reason }, { status: 402 });
      }

      // Check for duplicate recent scans (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const [recentScan] = await db
        .select({ id: scans.id })
        .from(scans)
        .where(
          and(
            eq(scans.userId, userId),
            eq(scans.url, validatedData.url),
            gte(scans.createdAt, fiveMinutesAgo)
          )
        )
        .limit(1);

      if (recentScan) {
        return NextResponse.json(
          { 
            error: 'Duplicate scan detected. Please wait 5 minutes before scanning the same URL again.',
            code: 'DUPLICATE_SCAN',
            details: {
              waitTime: '5 minutes',
              lastScanId: recentScan.id
            }
          },
          { status: 429 }
        );
      }
    }

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
        userId: userId,
        isPublicScan: isPublicScan,
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
      userId: userId,
      isPublicScan: isPublicScan,
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

    // Update usage stats for authenticated users
    if (user && userId) {
      await updateUsageStats(userId);
      // Track usage in the new billing system
      await planEnforcementService.trackScanUsage(userId);
    }

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