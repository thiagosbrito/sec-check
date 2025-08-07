import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { stripe, type StripeWebhookEvent } from './client';
import { billingService } from './billing';
import { db } from '@/lib/db/connection';
import { billingHistory, users, subscriptions, type NewBillingHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Extended types for properties that might not be in the official Stripe types
interface ExtendedSubscription extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface ExtendedInvoice extends Stripe.Invoice {
  subscription?: string;
  charge?: string;
  payment_intent?: string;
}

export interface WebhookHandler {
  event: StripeWebhookEvent;
  handler: (event: Stripe.Event) => Promise<void>;
}

export class StripeWebhookService {
  private handlers: Map<StripeWebhookEvent, (event: Stripe.Event) => Promise<void>>;

  constructor() {
    this.handlers = new Map([
      ['customer.subscription.created', this.handleSubscriptionCreated.bind(this)],
      ['customer.subscription.updated', this.handleSubscriptionUpdated.bind(this)],
      ['customer.subscription.deleted', this.handleSubscriptionDeleted.bind(this)],
      ['invoice.payment_succeeded', this.handlePaymentSucceeded.bind(this)],
      ['invoice.payment_failed', this.handlePaymentFailed.bind(this)],
      ['customer.created', this.handleCustomerCreated.bind(this)],
      ['customer.updated', this.handleCustomerUpdated.bind(this)],
    ]);
  }

  /**
   * Verify and process webhook event
   */
  async processWebhook(request: NextRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const body = await request.text();
      const signature = request.headers.get('stripe-signature');

      if (!signature) {
        throw new Error('Missing Stripe signature');
      }

      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('Missing webhook secret');
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log(`Processing webhook event: ${event.type}`);

      // Get handler for event type
      const handler = this.handlers.get(event.type as StripeWebhookEvent);

      if (handler) {
        await handler(event);
        console.log(`Successfully processed ${event.type}`);
      } else {
        console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as ExtendedSubscription;
    const userId = subscription.metadata.userId;

    if (!userId) {
      throw new Error('Missing userId in subscription metadata');
    }

    await billingService.upsertSubscription({
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      plan: subscription.metadata.plan as 'developer' | 'team',
      billingInterval: subscription.metadata.interval as 'monthly' | 'yearly',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    });
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as ExtendedSubscription;
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.warn('Missing userId in subscription metadata for update');
      return;
    }

    await billingService.upsertSubscription({
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      plan: subscription.metadata.plan as 'developer' | 'team',
      billingInterval: subscription.metadata.interval as 'monthly' | 'yearly',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as ExtendedSubscription;
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.warn('Missing userId in subscription metadata for deletion');
      return;
    }

    // Update subscription status to canceled
    await billingService.upsertSubscription({
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: 'canceled',
      plan: subscription.metadata.plan as 'developer' | 'team',
      billingInterval: subscription.metadata.interval as 'monthly' | 'yearly',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: new Date(subscription.canceled_at! * 1000),
      cancelAtPeriodEnd: true,
    });

    // Downgrade user to free plan
    await db
      .update(users)
      .set({ 
        plan: 'free',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as ExtendedInvoice;
    
    if (!invoice.subscription) {
      return; // Skip non-subscription invoices
    }

    // Find user by customer ID
    const user = await this.findUserByCustomerId(invoice.customer as string);
    
    if (!user) {
      console.warn(`User not found for customer: ${invoice.customer}`);
      return;
    }

    // Record billing history
    const billingData: NewBillingHistory = {
      userId: user.id,
      subscriptionId: null, // We'll update this after we find the subscription
      stripeInvoiceId: invoice.id,
      stripeChargeId: invoice.charge as string,
      stripePaymentIntentId: invoice.payment_intent as string,
      eventType: 'invoice.payment_succeeded',
      status: 'succeeded',
      amount: invoice.amount_paid || 0,
      currency: invoice.currency,
      description: invoice.description || `Payment for ${invoice.lines.data[0]?.description}`,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      metadata: {
        invoiceNumber: invoice.number || '',
        invoiceUrl: invoice.hosted_invoice_url || '',
      },
      processedAt: new Date(),
    };

    await db.insert(billingHistory).values(billingData);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as ExtendedInvoice;
    
    if (!invoice.subscription) {
      return; // Skip non-subscription invoices
    }

    // Find user by customer ID
    const user = await this.findUserByCustomerId(invoice.customer as string);
    
    if (!user) {
      console.warn(`User not found for customer: ${invoice.customer}`);
      return;
    }

    // Record billing history
    const billingData: NewBillingHistory = {
      userId: user.id,
      subscriptionId: null,
      stripeInvoiceId: invoice.id,
      eventType: 'invoice.payment_failed',
      status: 'failed',
      amount: invoice.amount_due || 0,
      currency: invoice.currency,
      description: invoice.description || `Failed payment for ${invoice.lines.data[0]?.description}`,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      failureCode: 'payment_failed',
      failureMessage: 'Payment failed - please update your payment method',
      metadata: {
        invoiceNumber: invoice.number || '',
        invoiceUrl: invoice.hosted_invoice_url || '',
        attemptCount: invoice.attempt_count || 1,
      },
      processedAt: new Date(),
    };

    await db.insert(billingHistory).values(billingData);

    // TODO: Send email notification about failed payment
    console.log(`Payment failed for user ${user.id}, invoice ${invoice.id}`);
  }

  /**
   * Handle customer created (optional)
   */
  private async handleCustomerCreated(event: Stripe.Event): Promise<void> {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer created: ${customer.id} (${customer.email})`);
  }

  /**
   * Handle customer updated (optional)
   */
  private async handleCustomerUpdated(event: Stripe.Event): Promise<void> {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer updated: ${customer.id} (${customer.email})`);
  }

  /**
   * Helper method to find user by Stripe customer ID
   */
  private async findUserByCustomerId(customerId: string) {
    const result = await db
      .select()
      .from(users)
      .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(eq(subscriptions.stripeCustomerId, customerId))
      .limit(1);

    return result.length > 0 ? result[0].users : null;
  }
}

export const webhookService = new StripeWebhookService();