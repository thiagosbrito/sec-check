"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { UpgradePlanDialog } from "@/components/UpgradePlanDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ArrowUp
} from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { PLAN_CONFIG } from '@/lib/stripe/config';

function BillingContent() {
  const searchParams = useSearchParams();
  const {
    subscriptionData,
    loading,
    error,
    fetchSubscription,
    openCustomerPortal,
    cancelSubscription,
    resumeSubscription,
    clearError
  } = useBilling();
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [urlMessage, setUrlMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Handle success/cancel URL parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      setUrlMessage({
        type: 'success',
        text: 'Payment processing... Please wait while we activate your subscription.'
      });
      
      // Polling function to check for subscription updates
      const pollForSubscription = async (attempts = 0, maxAttempts = 12) => {
        setIsPolling(true);
        
        try {
          const data = await fetchSubscription();
          
          // Check if subscription is now active or trialing
          if (data?.subscription && ['active', 'trialing'].includes(data.subscription.status)) {
            setUrlMessage({
              type: 'success',
              text: `Payment successful! Your subscription has been activated.${
                data.subscription.status === 'trialing' ? ' You are currently in your trial period.' : ''
              }`
            });
            setIsPolling(false);
            return;
          }
          
          // If not active yet and we have attempts left, try again
          if (attempts < maxAttempts) {
            setTimeout(() => pollForSubscription(attempts + 1, maxAttempts), 2000);
          } else {
            // Fallback message after max attempts
            setUrlMessage({
              type: 'error',
              text: 'Payment received, but subscription activation is taking longer than expected. Please refresh the page or contact support if the issue persists.'
            });
            setIsPolling(false);
          }
        } catch (error) {
          console.error('Error polling for subscription:', error);
          // On error, still try again if we have attempts left
          if (attempts < maxAttempts) {
            setTimeout(() => pollForSubscription(attempts + 1, maxAttempts), 2000);
          } else {
            // After max attempts, stop polling and show fallback message
            setUrlMessage({
              type: 'error',
              text: 'Payment received, but subscription activation is taking longer than expected. Please refresh the page or contact support if the issue persists.'
            });
            setIsPolling(false);
          }
        }
      };
      
      // Start polling
      pollForSubscription();
      
    } else if (canceled === 'true') {
      setUrlMessage({
        type: 'error',
        text: 'Payment was canceled. You can try again anytime.'
      });
    }

    // Clear URL parameters
    if (success || canceled) {
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url.toString());
      
      // Auto-clear message after 8 seconds (longer for polling)
      const clearTimer = setTimeout(() => setUrlMessage(null), 8000);
      
      // Clear timer if component unmounts
      return () => clearTimeout(clearTimer);
    }
  }, [searchParams, fetchSubscription]);

  const handleManageBilling = async () => {
    try {
      setActionLoading('portal');
      await openCustomerPortal();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading('cancel');
      await cancelSubscription();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading('resume');
      await resumeSubscription();
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'trialing':
        return 'text-blue-400';
      case 'past_due':
        return 'text-yellow-400';
      case 'canceled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'trialing':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
            <p className="text-gray-400">
              Manage your subscription, billing information, and payment methods
            </p>
          </div>
          
          <Button
            onClick={fetchSubscription}
            disabled={loading || isPolling}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loading || isPolling) ? 'animate-spin' : ''}`} />
            {isPolling ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>

        {(error || urlMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              urlMessage?.type === 'success' || (!error && urlMessage?.type !== 'error')
                ? 'bg-green-900/20 border border-green-500/50'
                : 'bg-red-900/20 border border-red-500/50'
            }`}
          >
            {urlMessage?.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-medium ${
                  urlMessage?.type === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {urlMessage?.type === 'success' ? 'Success' : 'Error'}
                </p>
                {isPolling && urlMessage?.type === 'success' && (
                  <RefreshCw className="w-4 h-4 text-green-400 animate-spin" />
                )}
              </div>
              <p className={`text-sm ${
                urlMessage?.type === 'success' ? 'text-green-200' : 'text-red-200'
              }`}>
                {urlMessage?.text || error?.message}
              </p>
            </div>
            <Button
              onClick={() => {
                clearError();
                setUrlMessage(null);
              }}
              variant="ghost"
              size="sm"
              className={urlMessage?.type === 'success' ? 'text-green-300 hover:text-green-200' : 'text-red-300 hover:text-red-200'}
            >
              ×
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Plan */}
          <GlassCard variant="dark" gradient="rainbow" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Current Plan</h2>
            </div>

            {subscriptionData?.subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white capitalize">
                      {subscriptionData.subscription.plan === 'free' ? 'Free Plan' : (PLAN_CONFIG[subscriptionData.subscription.plan as keyof typeof PLAN_CONFIG]?.name || subscriptionData.subscription.plan)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(subscriptionData.subscription.status)}
                      <span className={`text-sm capitalize ${getStatusColor(subscriptionData.subscription.status)}`}>
                        {subscriptionData.subscription.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ${(subscriptionData.subscription.pricePerMonth / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      per {subscriptionData.subscription.billingInterval}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Billing Period</span>
                    <span className="text-gray-200">
                      {subscriptionData.subscription.currentPeriodStart ? new Date(subscriptionData.subscription.currentPeriodStart).toLocaleDateString() : 'N/A'} - {' '}
                      {subscriptionData.subscription.currentPeriodEnd ? new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  
                  {subscriptionData.subscription.cancelAtPeriodEnd && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="text-yellow-400">Cancels at period end</span>
                    </div>
                  )}
                </div>

                {/* Note: Plan changes are now handled through Stripe Billing Portal */}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xl font-bold text-white mb-2">Free Plan</p>
                <p className="text-gray-400 mb-4">You&apos;re currently on the free plan</p>
                <UpgradePlanDialog currentPlan="free">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </UpgradePlanDialog>
              </div>
            )}
          </GlassCard>

          {/* Billing Actions */}
          <GlassCard variant="dark" gradient="rainbow" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Billing Management</h2>
            </div>

            <div className="space-y-3">
              {subscriptionData?.subscription ? (
                <Button
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                  className="w-full justify-between bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                >
                  <span>{actionLoading === 'portal' ? 'Opening Portal...' : 'Manage Billing'}</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              ) : (
                <UpgradePlanDialog currentPlan="free">
                  <Button className="w-full justify-between bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
                    <span>Upgrade to Manage Billing</span>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </UpgradePlanDialog>
              )}

              {subscriptionData?.subscription && !subscriptionData.subscription.cancelAtPeriodEnd && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={actionLoading === 'cancel'}
                      variant="outline"
                      className="w-full border-red-500 text-red-300 hover:text-red-200 hover:bg-red-900/20"
                    >
                      {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Cancel Subscription</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period, and you&apos;ll lose access to all premium features afterward.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                        Keep Subscription
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        I&apos;m sure, cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {subscriptionData?.subscription?.cancelAtPeriodEnd && (
                <Button
                  onClick={handleResumeSubscription}
                  disabled={actionLoading === 'resume'}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                >
                  {actionLoading === 'resume' ? 'Resuming...' : 'Resume Subscription'}
                </Button>
              )}

              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Use &quot;Manage Billing&quot; to update payment methods, view invoices, and manage billing details in the Stripe customer portal.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Plan Features */}
        {subscriptionData?.features && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard variant="dark" gradient="rainbow" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Plan Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Daily Scans</p>
                  <p className="text-white font-semibold">{subscriptionData.features?.scansPerDay || 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Monthly Scans</p>
                  <p className="text-white font-semibold">{subscriptionData.features?.scansPerMonth || 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Scan Types</p>
                  <p className="text-white font-semibold">All OWASP Top 10</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading billing information...</p>
          </div>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}