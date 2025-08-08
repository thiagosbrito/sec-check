import { useState, useEffect, useCallback } from 'react';
import { PlanType, BillingInterval } from '@/lib/stripe/config';
import type { Subscription, PlanFeatures } from '@/lib/db/schema';
import type Stripe from 'stripe';

interface SubscriptionData {
  subscription: Subscription | null;
  plan: string;
  features: PlanFeatures | null;
  stripeData: Stripe.Subscription | null;
}

interface BillingError {
  message: string;
  details?: Error;
}

export function useBilling() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<BillingError | null>(null);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      
      const data = await response.json();
      setSubscriptionData(data);
      
      return data;
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Failed to load subscription',
        details: err as Error
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create checkout session and redirect
  const createCheckoutSession = useCallback(async (
    plan: PlanType,
    interval: BillingInterval,
    successUrl?: string,
    cancelUrl?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          interval,
          successUrl,
          cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Failed to create checkout session',
        details: err as Error,
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Open customer portal
  const openCustomerPortal = useCallback(async (returnUrl?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: returnUrl || `${window.location.origin}/dashboard/billing`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Failed to open billing portal',
        details: err as Error
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      
      return true;
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Failed to cancel subscription',
        details: err as Error
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscription]);

  // Resume subscription
  const resumeSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/billing/subscription', {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resume subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      
      return true;
    } catch (err) {
      const error = {
        message: err instanceof Error ? err.message : 'Failed to resume subscription',
        details: err as Error
      };
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscription]);

  // Get current plan info
  const getCurrentPlan = useCallback(() => {
    if (!subscriptionData) return 'free';
    return subscriptionData.plan;
  }, [subscriptionData]);

  // Check if user has active subscription
  const hasActiveSubscription = useCallback(() => {
    if (!subscriptionData?.subscription) return false;
    return ['active', 'trialing'].includes(subscriptionData.subscription.status);
  }, [subscriptionData]);

  // Check if subscription is canceled but still active
  const isSubscriptionCanceled = useCallback(() => {
    if (!subscriptionData?.subscription) return false;
    return subscriptionData.subscription.cancelAtPeriodEnd;
  }, [subscriptionData]);

  // Get plan features
  const getPlanFeatures = useCallback(() => {
    return subscriptionData?.features || null;
  }, [subscriptionData]);

  // Initialize on mount
  useEffect(() => {
    fetchSubscription().catch(() => {
      // Ignore initial load errors - they'll be handled by the hook
    });
  }, [fetchSubscription]);

  return {
    // Data
    subscriptionData,
    loading,
    error,
    
    // Actions
    fetchSubscription,
    createCheckoutSession,
    openCustomerPortal,
    cancelSubscription,
    resumeSubscription,
    
    // Computed values
    currentPlan: getCurrentPlan(),
    hasActiveSubscription: hasActiveSubscription(),
    isSubscriptionCanceled: isSubscriptionCanceled(),
    planFeatures: getPlanFeatures(),
    
    // Utils
    clearError: () => setError(null),
  };
}