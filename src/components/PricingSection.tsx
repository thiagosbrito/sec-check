"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building, Shield } from "lucide-react";
import { PLAN_CONFIG } from '@/lib/stripe/config';

// Free plan configuration (not in Stripe)
const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    '1 scan per day',
    '3 scans per month',
    'Basic security reports',
    'Public scans only',
    'Community support',
  ],
  description: 'Perfect for trying out SecCheck',
  icon: Shield,
  color: 'from-gray-500 to-gray-600',
  popular: false,
  cta: 'Get Started Free',
};

// Plan metadata (visual and UX info)
const PLAN_METADATA = {
  developer: {
    icon: Zap,
    color: 'from-purple-500 to-blue-500',
    popular: false,
    description: 'For individual developers and small projects',
    cta: 'Get Started',
  },
  team: {
    icon: Crown,
    color: 'from-orange-500 to-red-500',
    popular: false,
    description: 'For teams and growing businesses',
    cta: 'Get Started',
  },
} as const;

// Combine all plans with metadata
const allPlans = [
  FREE_PLAN,
  ...Object.entries(PLAN_CONFIG).map(([planId, planConfig]) => ({
    id: planId,
    name: planConfig.name,
    monthlyPrice: planConfig.monthlyPrice,
    yearlyPrice: planConfig.yearlyPrice,
    features: planConfig.features,
    ...PLAN_METADATA[planId as keyof typeof PLAN_METADATA],
  })),
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

export default function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const getPrice = (plan: typeof allPlans[0]) => {
    const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    return price / 100; // Convert from cents to dollars
  };

  const getSavings = (plan: typeof allPlans[0]) => {
    if (plan.id === 'free') return null;
    const monthlyTotal = (plan.monthlyPrice * 12) / 100;
    const yearlyPrice = plan.yearlyPrice / 100;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <section id="pricing" className="relative px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Simple, Transparent
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Start with our free tier, then upgrade when you need more scans and advanced features.
          </p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mt-8 p-1 bg-gray-900 rounded-lg w-fit mx-auto"
          >
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-md transition-all relative ${
                billingInterval === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                Save 17%
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {allPlans.map((plan) => {
            const IconComponent = plan.icon;
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <motion.div key={plan.id} variants={itemVariants}>
                <GlassCard variant="dark" gradient="rainbow" className="h-full">
                  <div className="p-8 h-full flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-r ${plan.color} shadow-2xl mb-4`}
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                      
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-white">
                            ${plan.id === 'free' ? '0' : Math.floor(price)}
                          </span>
                          {price % 1 !== 0 && (
                            <span className="text-2xl font-bold text-white">
                              .{((price % 1) * 100).toFixed(0).padStart(2, '0')}
                            </span>
                          )}
                          <span className="text-gray-400">
                            {plan.id !== 'free' && `/${billingInterval === 'monthly' ? 'month' : 'year'}`}
                          </span>
                        </div>

                        {billingInterval === 'yearly' && savings && (
                          <div className="text-green-400 text-sm font-semibold">
                            Save ${savings.amount.toFixed(0)}/year ({savings.percentage}% off)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-start gap-3"
                        >
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-200 text-sm leading-relaxed">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      <Link
                        href={
                          plan.id === 'free'
                            ? '/sign-up'
                            : `/sign-up?plan=${plan.id}&interval=${billingInterval}`
                        }
                      >
                        <Button
                          className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
                            plan.id === 'free'
                              ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white border border-gray-500/50'
                              : 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg'
                          }`}
                        >
                          <span className="relative z-10">{plan.cta || 'Get Started'}</span>
                        </Button>
                      </Link>

                      {/* Additional Info */}
                      {plan.id !== 'free' && (
                        <p className="text-center text-xs text-gray-400 mt-4 opacity-75">
                          No setup fee • Cancel anytime
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm">
            All plans include safe, non-invasive testing • No setup fees • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}