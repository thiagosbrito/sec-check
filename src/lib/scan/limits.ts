/**
 * Scan limit service
 * Handles daily limits and rate limiting logic
 */

import { db } from '@/lib/db/connection';
import { users, scans } from '@/lib/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

export interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  scanId?: string;
  waitTime?: string;
}

export class ScanLimitService {
  /**
   * Checks if user has exceeded their daily scan limit
   */
  static async checkDailyLimit(userId: string): Promise<LimitCheckResult> {
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
      limit: user.scanLimit,
      used: todayCount
    };
  }

  /**
   * Checks for duplicate recent scans (within last 5 minutes)
   */
  static async checkDuplicateScan(userId: string, url: string): Promise<DuplicateCheckResult> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [recentScan] = await db
      .select({ id: scans.id })
      .from(scans)
      .where(
        and(
          eq(scans.userId, userId),
          eq(scans.url, url),
          gte(scans.createdAt, fiveMinutesAgo)
        )
      )
      .limit(1);

    if (recentScan) {
      return {
        isDuplicate: true,
        scanId: recentScan.id,
        waitTime: '5 minutes'
      };
    }

    return { isDuplicate: false };
  }
}
