"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Shield, FileText, CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Enter Your URL",
    description: "Simply paste your website URL. No registration required for basic scans.",
    icon: Search,
    color: "from-purple-500 to-violet-500"
  },
  {
    step: "02", 
    title: "Automated Scanning",
    description: "Our headless browser performs safe, non-invasive tests using OWASP Top 10 methodologies.",
    icon: Shield,
    color: "from-blue-500 to-cyan-500"
  },
  {
    step: "03",
    title: "Detailed Report",
    description: "Receive a comprehensive security report with actionable insights and remediation steps.",
    icon: FileText,
    color: "from-green-500 to-emerald-500"
  },
  {
    step: "04",
    title: "Take Action",
    description: "Implement the recommended fixes and track your security improvements over time.",
    icon: CheckCircle,
    color: "from-orange-500 to-red-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative px-6 py-20 lg:px-8">
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
              How SecCheck
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Our automated security testing process is designed to be simple, fast, and comprehensive. 
            Get professional-grade security insights in minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div key={step.step} variants={itemVariants}>
                <Card className="group relative h-full bg-gray-900/50 border-gray-800 hover:border-gray-600 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-800/20" />
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.color}`} />
                  
                  <CardContent className="relative p-6 text-center">
                    {/* Step Number */}
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 text-purple-400 font-bold text-lg mb-4 relative">
                      {step.step}
                      <div className="absolute inset-0 bg-purple-400/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Icon */}
                    <motion.div
                      className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.color} shadow-lg mb-4`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-200 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {step.description}
                    </p>

                    {/* Connection Line (hidden on mobile) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-600 to-transparent transform -translate-y-1/2" />
                    )}
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
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 rounded-full border border-green-700/30">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">
              100% Safe & Non-invasive Testing
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}