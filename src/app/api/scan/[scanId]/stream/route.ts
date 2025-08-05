import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { scans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const { scanId } = params;

    // Verify scan exists and is running
    const [scan] = await db
      .select()
      .from(scans)
      .where(eq(scans.id, scanId))
      .limit(1);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Railway automatically provides these environment variables:
    // RAILWAY_PUBLIC_DOMAIN or we'll need to set it manually
    const railwayWorkerUrl = process.env.RAILWAY_WORKER_URL;
    
    if (!railwayWorkerUrl) {
      return NextResponse.json({
        success: false,
        error: 'Live view not configured - RAILWAY_WORKER_URL not set'
      }, { status: 503 });
    }
    
    const vncStreamUrl = `${railwayWorkerUrl}:6080/vnc.html`;

    return NextResponse.json({
      success: true,
      data: {
        scanId: scan.id,
        streamUrl: vncStreamUrl,
        status: scan.status,
        liveViewEnabled: true, // Always enabled since Railway worker has VNC
        instructions: {
          message: 'Live browser view is available during scan execution',
          note: 'The stream will show Playwright automating browser interactions in real-time'
        }
      }
    });

  } catch (error) {
    console.error('Stream API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}