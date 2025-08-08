/**
 * Scan API endpoint
 * POST /api/scan - Create a new security scan
 * GET /api/scan - Health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ScanService } from '@/lib/scan';

// Request validation schema
const scanRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  isPublicScan: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = scanRequestSchema.parse(body);

    // Prepare scan request
    const scanRequest = {
      url: validatedData.url,
      userId: user?.id || null,
      isPublicScan: validatedData.isPublicScan,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
    };

    // Process scan through service
    const result = await ScanService.processScanRequest(scanRequest);

    if (!result.success) {
      const statusCode = result.code === 'DAILY_LIMIT_EXCEEDED' || result.code === 'DUPLICATE_SCAN' ? 429 :
                        result.code === 'PLAN_LIMIT_EXCEEDED' ? 402 :
                        result.code === 'INVALID_PROTOCOL' || result.code === 'PRIVATE_NETWORK' ? 400 : 500;

      return NextResponse.json(
        { 
          error: result.error,
          code: result.code,
          details: result.details,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    services: {
      scan: 'operational',
      queue: 'operational',
      database: 'operational',
    },
  });
}
