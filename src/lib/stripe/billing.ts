import { stripe, getStripePriceId, getPlanPrice, type PlanType, type BillingInterval } from './client';
import { db } from '@/lib/db/connection';
import { subscriptions, users, type NewSubscription } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
      // Check if user already has a subscription
      const existingSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existingSubscription.length > 0) {
        throw new Error('User already has an active subscription');
      }

      // Get or create Stripe customer
      let stripeCustomerId: string;
      
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
      // Get user's subscription
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (subscription.length === 0) {
        throw new Error('No subscription found for user');
      }

      const stripeCustomerId = subscription[0].stripeCustomerId;

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
   * Get subscription details for a user
   */
  async getUserSubscription(userId: string) {
    try {
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (subscription.length === 0) {
        return null;
      }

      const sub = subscription[0];

      // Get latest subscription data from Stripe
      if (sub.stripeSubscriptionId) {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          sub.stripeSubscriptionId,
          {
            expand: ['latest_invoice', 'customer'],
          }
        );

        return {
          ...sub,
          stripeData: stripeSubscription,
        };
      }

      return sub;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  /**
   * Create or update subscription record in database
   */
  async upsertSubscription(data: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    status: string;
    plan: PlanType;
    billingInterval: BillingInterval;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialStart?: Date;
    trialEnd?: Date;
    canceledAt?: Date;
    cancelAtPeriodEnd?: boolean;
  }): Promise<void> {
    try {
      const subscriptionData: NewSubscription = {
        userId: data.userId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripePriceId: data.stripePriceId,
        status: data.status as 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid',
        plan: data.plan,
        billingInterval: data.billingInterval === 'monthly' ? ('month' as const) : ('year' as const),
        pricePerMonth: getPlanPrice(data.plan, data.billingInterval),
        currency: 'usd',
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        trialStart: data.trialStart,
        trialEnd: data.trialEnd,
        canceledAt: data.canceledAt,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        updatedAt: new Date(),
      };

      // Upsert subscription
      await db
        .insert(subscriptions)
        .values(subscriptionData)
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
            stripePriceId: subscriptionData.stripePriceId,
            status: subscriptionData.status,
            plan: subscriptionData.plan,
            billingInterval: subscriptionData.billingInterval,
            pricePerMonth: subscriptionData.pricePerMonth,
            currentPeriodStart: subscriptionData.currentPeriodStart,
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
            trialStart: subscriptionData.trialStart,
            trialEnd: subscriptionData.trialEnd,
            canceledAt: subscriptionData.canceledAt,
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
            updatedAt: subscriptionData.updatedAt,
          },
        });

      // Update user plan
      await db
        .update(users)
        .set({ 
          plan: data.plan,
          updatedAt: new Date(),
        })
        .where(eq(users.id, data.userId));

    } catch (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local database
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));

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
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      // Resume subscription in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update local database
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: false,
          canceledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));

    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }
}

export const billingService = new BillingService();