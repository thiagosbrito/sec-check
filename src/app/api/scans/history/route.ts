import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/connection';
import { scans } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to view your scan history' },
        { status: 401 }
      );
    }

    // Fetch user's scans from database
    const userScans = await db
      .select({
        id: scans.id,
        url: scans.url,
        domain: scans.domain,
        status: scans.status,
        createdAt: scans.createdAt,
        completedAt: scans.completedAt,
        totalVulnerabilities: scans.totalVulnerabilities,
        criticalCount: scans.criticalCount,
        highCount: scans.highCount,
        mediumCount: scans.mediumCount,
        lowCount: scans.lowCount,
        infoCount: scans.infoCount,
      })
      .from(scans)
      .where(eq(scans.userId, user.id))
      .orderBy(desc(scans.createdAt))
      .limit(50); // Limit to last 50 scans

    // Transform data to match frontend interface
    const scanHistory = userScans.map(scan => {
      const vulnerabilitiesFound = scan.totalVulnerabilities || 0;
      
      // Calculate risk score based on vulnerability counts
      let riskScore: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if ((scan.criticalCount || 0) > 0) {
        riskScore = 'critical';
      } else if ((scan.highCount || 0) > 0) {
        riskScore = 'high';
      } else if ((scan.mediumCount || 0) > 0) {
        riskScore = 'medium';
      }

      return {
        id: scan.id,
        url: scan.url,
        domain: scan.domain,
        status: scan.status,
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
        vulnerabilitiesFound,
        riskScore,
        testsRun: 10, // TODO: Calculate actual number of tests run
      };
    });

    return NextResponse.json({
      success: true,
      data: scanHistory,
    });

  } catch (error) {
    console.error('Scan history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}