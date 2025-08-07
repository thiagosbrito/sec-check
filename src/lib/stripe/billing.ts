import { stripe, getStripePriceId, type PlanType, type BillingInterval } from './client';
import { PLAN_CONFIG } from './config';
import { db } from '@/lib/db/connection';
import { subscriptions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
  userId: string;
  plan: PlanType;
  interval: BillingInterval;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCustomerPortalParams {
  userId: string;
  returnUrl: string;
}

export class BillingService {
  /**
   * Create a Stripe Checkout session for subscription
   */
  async createCheckoutSession({
    userId,
    plan,
    interval,
    userEmail,
    successUrl,
    cancelUrl,
  }: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    try {
      // Check if user already has an active subscription
      const existingCustomer = await db
        .select({ stripeCustomerId: subscriptions.stripeCustomerId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existingCustomer.length > 0) {
        // Check if they have an active subscription in Stripe
        const activeSubscriptions = await db.execute(
          sql`
            SELECT id, status FROM stripe.subscriptions 
            WHERE customer = ${existingCustomer[0].stripeCustomerId}
            AND status IN ('active', 'trialing', 'past_due')
            LIMIT 1
          `
        );
        
        if (activeSubscriptions.length > 0) {
          throw new Error('User already has an active subscription');
        }
      }

      // Get or create Stripe customer
      let stripeCustomerId: string;
      
      if (existingCustomer.length > 0) {
        stripeCustomerId = existingCustomer[0].stripeCustomerId;
      } else {
        // Try to find existing customer by email
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
              userId,
            },
          });
          stripeCustomerId = customer.id;
        }
        
        // Store customer relation for future foreign table queries
        await this.storeCustomerRelation(userId, stripeCustomerId);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: getStripePriceId(plan, interval),
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        subscription_data: {
          metadata: {
            userId,
            plan,
            interval,
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe Customer Portal session
   */
  async createCustomerPortal({
    userId,
    returnUrl,
  }: CreateCustomerPortalParams): Promise<Stripe.BillingPortal.Session> {
    try {
      // Get user's customer ID
      const customerData = await db
        .select({ stripeCustomerId: subscriptions.stripeCustomerId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (customerData.length === 0) {
        throw new Error('No customer found for user');
      }

      const stripeCustomerId = customerData[0].stripeCustomerId;

      // Create portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });

      return portalSession;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  /**
   * Get subscription details for a user using Stripe foreign tables
   */
  async getUserSubscription(userId: string) {
    try {
      // Get user's Stripe customer ID
      const customerData = await db
        .select({ stripeCustomerId: subscriptions.stripeCustomerId })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (customerData.length === 0) {
        return null;
      }

      const customerId = customerData[0].stripeCustomerId;

      // Query Stripe subscription data directly via foreign table
      const stripeSubscriptions = await db.execute(
        sql`
          SELECT 
            s.id,
            s.customer,
            s.currency,
            s.current_period_start,
            s.current_period_end,
            s.attrs
          FROM stripe.subscriptions s
          WHERE s.customer = ${customerId}
          AND (s.attrs->>'status' = 'active' 
               OR s.attrs->>'status' = 'trialing' 
               OR s.attrs->>'status' = 'past_due')
          ORDER BY (s.attrs->>'created')::bigint DESC
          LIMIT 1
        `
      );

      if (stripeSubscriptions.length === 0) {
        return null;
      }

      const stripeData = stripeSubscriptions[0] as {
        id: string;
        customer: string;
        currency: string;
        current_period_start: string;
        current_period_end: string;
        attrs: {
          status: string;
          trial_start?: number | null;
          trial_end?: number | null;
          canceled_at?: number | null;
          cancel_at_period_end: boolean;
          metadata?: Record<string, string> | null;
          [key: string]: unknown;
        };
      };
      const plan = stripeData.attrs.metadata?.plan || 'developer';
      const interval = stripeData.attrs.metadata?.interval || 'monthly';
      
      // Convert to our format
      return {
        subscription: {
          id: stripeData.id,
          status: stripeData.attrs.status,
          plan: plan,
          billingInterval: interval === 'monthly' ? 'month' : 'year',
          pricePerMonth: PLAN_CONFIG[plan as PlanType]?.[interval === 'monthly' ? 'monthlyPrice' : 'yearlyPrice'] || 2999,
          currentPeriodStart: stripeData.current_period_start,
          currentPeriodEnd: stripeData.current_period_end,
          trialStart: stripeData.attrs.trial_start ? new Date(stripeData.attrs.trial_start * 1000).toISOString() : null,
          trialEnd: stripeData.attrs.trial_end ? new Date(stripeData.attrs.trial_end * 1000).toISOString() : null,
          cancelAtPeriodEnd: stripeData.attrs.cancel_at_period_end || false,
          canceledAt: stripeData.attrs.canceled_at ? new Date(stripeData.attrs.canceled_at * 1000).toISOString() : null,
        },
        plan: plan,
        features: this.getPlanFeatures(plan),
        stripeData,
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }
  
  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscriptionData = await this.getUserSubscription(userId);
      
      if (!subscriptionData?.subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscriptionData.subscription.id as string, {
        cancel_at_period_end: true,
      });

      console.log(`✅ Subscription ${subscriptionData.subscription.id} marked for cancellation`);

    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Resume a canceled subscription
   */
  async resumeSubscription(userId: string): Promise<void> {
    try {
      const subscriptionData = await this.getUserSubscription(userId);
      
      if (!subscriptionData?.subscription) {
        throw new Error('No subscription found');
      }

      // Resume subscription in Stripe
      await stripe.subscriptions.update(subscriptionData.subscription.id as string, {
        cancel_at_period_end: false,
      });

      console.log(`✅ Subscription ${subscriptionData.subscription.id} resumed`);

    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Get plan features by plan type
   */
  private getPlanFeatures(plan: string) {
    const planConfig = PLAN_CONFIG[plan as PlanType];
    if (!planConfig) return null;
    
    return {
      dailyScans: plan === 'developer' ? 15 : 50,
      monthlyScans: plan === 'developer' ? 15 : 50,
      scanTypes: 'All OWASP Top 10 tests',
      features: planConfig.features,
    };
  }

  /**
   * Store customer relationship for foreign table queries
   */
  private async storeCustomerRelation(userId: string, stripeCustomerId: string): Promise<void> {
    try {
      console.log(`🔄 Storing customer relation for userId: ${userId}`);
      
      await db
        .insert(subscriptions)
        .values({
          userId,
          stripeCustomerId,
          stripeSubscriptionId: '',
          stripePriceId: '',
          status: 'incomplete',
          plan: 'free',
          billingInterval: 'month',
          pricePerMonth: 0,
          currency: 'usd',
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            stripeCustomerId,
            updatedAt: new Date(),
          },
        });
        
      console.log(`✅ Customer relation stored successfully`);
      
    } catch (error) {
      console.error('Error storing customer relation:', error);
      throw error;
    }
  }
}

export const billingService = new BillingService();