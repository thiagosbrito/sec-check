"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Zap, 
  Crown, 
  Shield,
  Loader2
} from "lucide-react";
import { PLAN_CONFIG, type PlanType, type BillingInterval } from '@/lib/stripe/config';
import { useBilling } from "@/hooks/useBilling";

interface UpgradePlanDialogProps {
  children: React.ReactNode;
  currentPlan?: string;
}

// Plan metadata (visual and UX info)
const PLAN_METADATA = {
  developer: {
    icon: Zap,
    color: 'from-purple-500 to-blue-500',
    popular: true,
    description: 'For individual developers and small projects',
    badge: 'Most Popular',
  },
  team: {
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    popular: false,
    description: 'For teams and growing businesses',
    badge: 'Best Value',
  },
} as const;

export function UpgradePlanDialog({ children, currentPlan = 'free' }: UpgradePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const { createCheckoutSession, loading } = useBilling();

  const getPrice = (plan: PlanType) => {
    const price = billingInterval === 'monthly' ? PLAN_CONFIG[plan].monthlyPrice : PLAN_CONFIG[plan].yearlyPrice;
    return price / 100; // Convert from cents to dollars
  };

  const getSavings = (plan: PlanType) => {
    const monthlyTotal = (PLAN_CONFIG[plan].monthlyPrice * 12) / 100;
    const yearlyPrice = PLAN_CONFIG[plan].yearlyPrice / 100;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  const handleUpgrade = async (plan: PlanType) => {
    try {
      setSelectedPlan(plan);
      await createCheckoutSession(
        plan,
        billingInterval,
        `${window.location.origin}/dashboard/billing?success=true`,
        `${window.location.origin}/dashboard/billing?canceled=true`
      );
      setOpen(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to start checkout process';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // You could show a toast notification here instead
      alert(`Upgrade failed: ${errorMessage}`);
      
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose the plan that best fits your security testing needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 bg-gray-800 rounded-lg w-fit">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                  billingInterval === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-md transition-all text-sm font-medium relative ${
                  billingInterval === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-1 py-0.5">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>

          {/* Current Plan Notice */}
          {currentPlan !== 'free' && (
            <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-blue-200 font-medium">
                    You&apos;re currently on the {PLAN_CONFIG[currentPlan as PlanType]?.name || currentPlan} plan
                  </p>
                  <p className="text-blue-300 text-sm">
                    Upgrading will prorate your current billing period
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PLAN_CONFIG).map(([planId, planConfig]) => {
              const planKey = planId as PlanType;
              const metadata = PLAN_METADATA[planKey];
              const IconComponent = metadata.icon;
              const price = getPrice(planKey);
              const savings = getSavings(planKey);
              const isCurrentPlan = currentPlan === planId;
              const isUpgrading = selectedPlan === planKey && loading;

              return (
                <motion.div key={planId} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <GlassCard 
                    variant="dark" 
                    gradient="rainbow" 
                    className={`h-full relative ${metadata.popular ? 'ring-2 ring-purple-500' : ''}`}
                  >
                    {metadata.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white font-semibold px-3 py-1">
                          {metadata.badge}
                        </Badge>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div className={`relative inline-flex p-3 rounded-xl bg-gradient-to-r ${metadata.color} shadow-lg mb-3`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">{planConfig.name}</h3>
                        <p className="text-gray-400 text-sm mb-4">{metadata.description}</p>
                        
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-bold text-white">
                              ${Math.floor(price)}
                            </span>
                            {price % 1 !== 0 && (
                              <span className="text-xl font-bold text-white">
                                .{((price % 1) * 100).toFixed(0).padStart(2, '0')}
                              </span>
                            )}
                            <span className="text-gray-400">
                              /{billingInterval === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>

                          {billingInterval === 'yearly' && (
                            <div className="text-green-400 text-sm font-semibold">
                              Save ${savings.amount.toFixed(0)}/year ({savings.percentage}% off)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {planConfig.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-200 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleUpgrade(planKey)}
                        disabled={isCurrentPlan || isUpgrading || loading}
                        className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-300 ${
                          isCurrentPlan
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white hover:scale-[1.02] hover:shadow-lg'
                        }`}
                      >
                        {isUpgrading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : (
                          `Upgrade to ${planConfig.name}`
                        )}
                      </Button>

                      {!isCurrentPlan && (
                        <p className="text-center text-xs text-gray-400 mt-3">
                          No setup fee • Cancel anytime
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Note */}
          <div className="text-center text-sm text-gray-400">
            <p>All plans include safe, non-invasive testing • Secure payment by Stripe</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}