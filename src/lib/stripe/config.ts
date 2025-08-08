// Client-safe Stripe configuration (no server secrets)

// Plan configurations (client-safe data)
export const PLAN_CONFIG = {
  developer: {
    name: 'Developer',
    monthlyPrice: 999, // $9.99 in cents
    yearlyPrice: 9999, // $99.99 in cents (2 months free)
    features: [
      '1 Project',
      'Up to 15 scans per month',
      'Domain verification',
      'API access',
      'Advanced reports',
      'Priority support',
    ],
  },
  team: {
    name: 'Team',
    monthlyPrice: 2999, // $29.99 in cents
    yearlyPrice: 29999, // $299.99 in cents (2 months free)
    features: [
      'Up to 5 Projects',
      'Up to 50 scans per month',
      'Domain verification',
      'Advanced API access',
      'Custom branded reports',
      'Priority support',
      'Webhook support',
      'Team access',
      'SSO support',
    ],
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;
export type BillingInterval = 'monthly' | 'yearly';

// Helper functions (client-safe)
export function getPlanPrice(plan: PlanType, interval: BillingInterval): number {
  return interval === 'monthly' 
    ? PLAN_CONFIG[plan].monthlyPrice 
    : PLAN_CONFIG[plan].yearlyPrice;
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}