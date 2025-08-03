"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out SecCheck",
    icon: Zap,
    color: "from-gray-500 to-gray-600",
    popular: false,
    features: [
      "1 scan per day",
      "Basic OWASP Top 10 tests",
      "Essential security report",
      "Public URL scanning only",
      "Email support"
    ],
    limitations: [
      "No scan history",
      "No API access",
      "Standard priority"
    ]
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For developers and small teams",
    icon: Crown,
    color: "from-purple-500 to-blue-500",
    popular: true,
    features: [
      "50 scans per month",
      "Full OWASP Top 10 + CVE database",
      "Detailed vulnerability reports",
      "90-day scan history",
      "Domain verification",
      "API access",
      "Priority support",
      "Custom report branding"
    ],
    limitations: []
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with compliance needs",
    icon: Building,
    color: "from-orange-500 to-red-500",
    popular: false,
    features: [
      "Unlimited scans",
      "Advanced security testing",
      "Compliance reporting (SOC2, PCI DSS)",
      "Unlimited scan history",
      "White-label reports",
      "SSO integration",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee"
    ],
    limitations: []
  }
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
            Choose the plan that fits your security testing needs. 
            Start free and upgrade as your requirements grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <motion.div key={plan.name} variants={itemVariants}>
                <Card className={`group relative h-full transition-all duration-300 overflow-hidden ${
                  plan.popular 
                    ? 'bg-gray-900/70 border-purple-500/50 ring-2 ring-purple-500/20 scale-105' 
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 font-semibold text-sm">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-800/20" />
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${plan.color}`} />
                  
                  <CardContent className={`relative p-8 ${plan.popular ? 'pt-16' : ''}`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-r ${plan.color} shadow-lg mb-4`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                      
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                        <span className="text-gray-400">{plan.period}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-3"
                        >
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={`w-full font-semibold py-3 transition-all duration-200 transform hover:scale-105 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </CardContent>

                  {/* Hover Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
                </Card>
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