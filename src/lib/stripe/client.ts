import Stripe from 'stripe';
import { BillingInterval, PlanType } from './config';

// Lazy initialization of Stripe client
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY ?? '';
    if (!secretKey) {
      throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    });
  }
  
  return stripeInstance;
}

// Export a getter function instead of the direct instance
export const stripe = {
  get instance() {
    return getStripe();
  }
};

// Stripe price IDs for different plans (to be configured in Stripe Dashboard)
export const STRIPE_PLANS = {
  developer: {
    monthly: 'price_1RtGajL3QQzQQqldqhd0EeIC', // Replace with actual Stripe price ID
    yearly: 'price_1RtGocL3QQzQQqldDMmWqRY2',  // Replace with actual Stripe price ID
  },
  team: {
    monthly: 'price_1RtGbKL3QQzQQqldSTCokYBA', // Replace with actual Stripe price ID
    yearly: 'price_1RtGpNL3QQzQQqld9AuiPSZJ',  // Replace with actual Stripe price ID
  },
} as const;

// Import client-safe configuration
export { PLAN_CONFIG, type PlanType, type BillingInterval, getPlanPrice, formatPrice } from './config';

// Helper functions
export function getStripePriceId(plan: PlanType, interval: BillingInterval): string {
  const billingKey = interval === 'monthly' ? 'monthly' : 'yearly';
  return STRIPE_PLANS[plan][billingKey];
}

// Stripe event types we handle
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.paid',
  'customer.created',
  'customer.updated',
  'product.updated',
] as const;

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number];