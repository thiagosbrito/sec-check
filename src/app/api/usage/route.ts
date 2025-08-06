import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/connection';
import { scans, users } from '@/lib/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to view usage stats' },
        { status: 401 }
      );
    }

    // Get user's plan and limits
    const [userInfo] = await db
      .select({ 
        scanLimit: users.scanLimit, 
        plan: users.plan,
        name: users.name,
        email: users.email 
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get today's date boundaries
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's scan count
    const [todayUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scans)
      .where(
        and(
          eq(scans.userId, user.id),
          gte(scans.createdAt, startOfDay),
          lt(scans.createdAt, endOfDay)
        )
      );

    // Get total scan count
    const [totalUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scans)
      .where(eq(scans.userId, user.id));

    // Get total vulnerabilities found
    const [vulnStats] = await db
      .select({ 
        total: sql<number>`sum(COALESCE(${scans.totalVulnerabilities}, 0))`,
        critical: sql<number>`sum(COALESCE(${scans.criticalCount}, 0))`,
        high: sql<number>`sum(COALESCE(${scans.highCount}, 0))`,
        medium: sql<number>`sum(COALESCE(${scans.mediumCount}, 0))`,
        low: sql<number>`sum(COALESCE(${scans.lowCount}, 0))`
      })
      .from(scans)
      .where(eq(scans.userId, user.id));

    const todayCount = Number(todayUsage?.count) || 0;
    const totalScans = Number(totalUsage?.count) || 0;
    const remaining = Math.max(0, userInfo.scanLimit - todayCount);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          plan: userInfo.plan,
          scanLimit: userInfo.scanLimit,
        },
        usage: {
          today: {
            scans: todayCount,
            remaining: remaining,
            limit: userInfo.scanLimit,
            percentage: Math.round((todayCount / userInfo.scanLimit) * 100),
          },
          total: {
            scans: totalScans,
            vulnerabilities: {
              total: Number(vulnStats?.total) || 0,
              critical: Number(vulnStats?.critical) || 0,
              high: Number(vulnStats?.high) || 0,
              medium: Number(vulnStats?.medium) || 0,
              low: Number(vulnStats?.low) || 0,
            }
          }
        },
        resetTime: 'midnight'
      },
    });

  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}