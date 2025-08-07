import Stripe from 'stripe';
import { BillingInterval, PlanType } from './config';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

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
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
] as const;

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number];