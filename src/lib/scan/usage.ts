/**
 * Usage tracking service
 * Handles usage statistics and analytics
 */

import { db } from '@/lib/db/connection';
import { users, usageStats } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export class UsageTrackingService {
  /**
   * Updates daily usage statistics for a user
   */
  static async updateUsageStats(userId: string): Promise<void> {
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

  /**
   * Gets usage statistics for a user for a specific date
   */
  static async getUserUsageForDate(userId: string, date: Date): Promise<{
    scansCount: number;
    apiCallsCount: number;
    planAtTime: string;
  } | null> {
    const [stats] = await db
      .select({
        scansCount: usageStats.scansCount,
        apiCallsCount: usageStats.apiCallsCount,
        planAtTime: usageStats.planAtTime,
      })
      .from(usageStats)
      .where(
        eq(usageStats.userId, userId) &&
        eq(usageStats.date, date)
      )
      .limit(1);

    if (!stats) return null;

    return {
      scansCount: stats.scansCount || 0,
      apiCallsCount: stats.apiCallsCount || 0,
      planAtTime: stats.planAtTime,
    };
  }
}
