import { db } from '@/lib/db/connection';
import { users, planFeatures, usageStats, subscriptions } from '@/lib/db/schema';
import { eq, and, gte, lt, sum, sql } from 'drizzle-orm';

export interface PlanLimits {
  scansPerDay: number;
  scansPerMonth: number;
  domainVerification: boolean;
  apiAccess: boolean;
  advancedReports: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  apiCallsPerHour: number;
  maxApiKeys: number;
  webhookSupport: boolean;
  teamAccess: boolean;
  ssoSupport: boolean;
}

export interface UsageCounts {
  scansToday: number;
  scansThisMonth: number;
  apiCallsThisHour: number;
}

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  limits: PlanLimits;
  usage: UsageCounts;
  upgradeRequired?: boolean;
}

export class PlanEnforcementService {
  /**
   * Check if user can perform an action based on their plan limits
   */
  async checkScanLimit(userId: string): Promise<PlanCheckResult> {
    try {
      // Get user's current plan
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const userPlan = user[0].plan;

      // Get plan limits
      const planLimitsResult = await db
        .select()
        .from(planFeatures)
        .where(eq(planFeatures.plan, userPlan))
        .limit(1);

      if (planLimitsResult.length === 0) {
        throw new Error(`Plan features not found for plan: ${userPlan}`);
      }

      const limits = planLimitsResult[0];

      // Get current usage
      const usage = await this.getUserUsage(userId);

      // Check daily limit
      if (usage.scansToday >= limits.scansPerDay) {
        return {
          allowed: false,
          reason: `Daily scan limit reached (${limits.scansPerDay} scans per day)`,
          limits: limits as PlanLimits,
          usage,
          upgradeRequired: userPlan === 'free',
        };
      }

      // Check monthly limit
      if (usage.scansThisMonth >= limits.scansPerMonth) {
        return {
          allowed: false,
          reason: `Monthly scan limit reached (${limits.scansPerMonth} scans per month)`,
          limits: limits as PlanLimits,
          usage,
          upgradeRequired: userPlan === 'free',
        };
      }

      return {
        allowed: true,
        limits: limits as PlanLimits,
        usage,
      };

    } catch (error) {
      console.error('Error checking scan limit:', error);
      throw error;
    }
  }

  /**
   * Check if user can access API based on their plan
   */
  async checkApiAccess(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const planLimitsResult = await db
        .select()
        .from(planFeatures)
        .where(eq(planFeatures.plan, user[0].plan))
        .limit(1);

      if (planLimitsResult.length === 0) {
        return { allowed: false, reason: 'Plan not found' };
      }

      const limits = planLimitsResult[0];

      if (!limits.apiAccess) {
        return {
          allowed: false,
          reason: 'API access not included in your current plan. Upgrade to Pro or Enterprise.',
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking API access:', error);
      throw error;
    }
  }

  /**
   * Check if user can verify domains
   */
  async checkDomainVerificationAccess(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const planLimitsResult = await db
        .select()
        .from(planFeatures)
        .where(eq(planFeatures.plan, user[0].plan))
        .limit(1);

      if (planLimitsResult.length === 0) {
        return { allowed: false, reason: 'Plan not found' };
      }

      const limits = planLimitsResult[0];

      if (!limits.domainVerification) {
        return {
          allowed: false,
          reason: 'Domain verification not included in your current plan. Upgrade to Pro or Enterprise.',
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking domain verification access:', error);
      throw error;
    }
  }

  /**
   * Get user's current usage statistics
   */
  async getUserUsage(userId: string): Promise<UsageCounts> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

      // Get today's usage
      const todayUsage = await db
        .select({
          scansCount: sum(usageStats.scansCount),
        })
        .from(usageStats)
        .where(
          and(
            eq(usageStats.userId, userId),
            gte(usageStats.date, todayStart)
          )
        );

      // Get this month's usage
      const monthUsage = await db
        .select({
          scansCount: sum(usageStats.scansCount),
        })
        .from(usageStats)
        .where(
          and(
            eq(usageStats.userId, userId),
            gte(usageStats.date, monthStart)
          )
        );

      // Get this hour's API usage (if needed)
      const hourUsage = await db
        .select({
          apiCallsCount: sum(usageStats.apiCallsCount),
        })
        .from(usageStats)
        .where(
          and(
            eq(usageStats.userId, userId),
            gte(usageStats.date, hourStart),
            lt(usageStats.date, new Date(hourStart.getTime() + 60 * 60 * 1000))
          )
        );

      return {
        scansToday: Number(todayUsage[0]?.scansCount || 0),
        scansThisMonth: Number(monthUsage[0]?.scansCount || 0),
        apiCallsThisHour: Number(hourUsage[0]?.apiCallsCount || 0),
      };

    } catch (error) {
      console.error('Error getting user usage:', error);
      return {
        scansToday: 0,
        scansThisMonth: 0,
        apiCallsThisHour: 0,
      };
    }
  }

  /**
   * Track usage for a user (increment counters)
   */
  async trackScanUsage(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get user's current plan for tracking
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Get subscription ID if user has one
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const subscriptionId = subscription.length > 0 ? subscription[0].id : null;

      // Insert or update usage stats
      await db
        .insert(usageStats)
        .values({
          userId,
          date: today,
          scansCount: 1,
          apiCallsCount: 0,
          planAtTime: user[0].plan,
          subscriptionId,
        })
        .onConflictDoUpdate({
          target: [usageStats.userId, usageStats.date],
          set: {
            scansCount: sql`${usageStats.scansCount} + 1`,
          },
        });

    } catch (error) {
      console.error('Error tracking scan usage:', error);
      throw error;
    }
  }

  /**
   * Track API call usage
   */
  async trackApiUsage(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get user's current plan
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Get subscription ID if user has one
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const subscriptionId = subscription.length > 0 ? subscription[0].id : null;

      // Insert or update usage stats
      await db
        .insert(usageStats)
        .values({
          userId,
          date: today,
          scansCount: 0,
          apiCallsCount: 1,
          planAtTime: user[0].plan,
          subscriptionId,
        })
        .onConflictDoUpdate({
          target: [usageStats.userId, usageStats.date],
          set: {
            apiCallsCount: sql`${usageStats.apiCallsCount} + 1`,
          },
        });

    } catch (error) {
      console.error('Error tracking API usage:', error);
      throw error;
    }
  }

  /**
   * Get user's plan details and subscription status
   */
  async getUserPlanDetails(userId: string) {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const planLimitsResult = await db
        .select()
        .from(planFeatures)
        .where(eq(planFeatures.plan, user[0].plan))
        .limit(1);

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const usage = await this.getUserUsage(userId);

      return {
        user: user[0],
        plan: user[0].plan,
        limits: planLimitsResult[0] || null,
        subscription: subscription[0] || null,
        usage,
      };

    } catch (error) {
      console.error('Error getting user plan details:', error);
      throw error;
    }
  }
}

export const planEnforcementService = new PlanEnforcementService();