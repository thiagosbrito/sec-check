"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Lock, 
  Server, 
  Globe, 
  AlertTriangle, 
  Settings,
  Bug,
  Zap,
  CheckCircle
} from "lucide-react";

const features = [
  {
    id: "A07",
    title: "Token & Secret Detection",
    description: "Detect exposed API keys, bearer tokens, and sensitive data in responses and client-side code",
    icon: Lock,
    color: "from-red-500 to-pink-500",
    tests: ["Bearer Token Leakage", "Cookie Security Flags", "Token Leakage in HTML/JS"]
  },
  {
    id: "A05", 
    title: "Security Configuration",
    description: "Audit security headers, CORS policies, and directory exposure vulnerabilities",
    icon: Settings,
    color: "from-orange-500 to-red-500",
    tests: ["Security Header Audit", "CORS Policy Analysis", "Directory Exposure Detection"]
  },
  {
    id: "A03",
    title: "Injection Testing", 
    description: "Test for XSS, SQL injection, and reflected input validation vulnerabilities",
    icon: Bug,
    color: "from-yellow-500 to-orange-500",
    tests: ["Passive XSS Testing", "SQL Injection Detection", "Reflected Input Validation"]
  },
  {
    id: "A02",
    title: "Cryptographic Failures",
    description: "Analyze TLS/SSL configuration and encryption implementation",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    tests: ["TLS/SSL Configuration", "Certificate Analysis", "Encryption Standards"]
  },
  {
    id: "A06",
    title: "Vulnerable Components",
    description: "Scan for outdated JavaScript libraries and known CVE vulnerabilities",
    icon: AlertTriangle,
    color: "from-blue-500 to-cyan-500",
    tests: ["Outdated JS Libraries", "CVE Database Matching", "Dependency Analysis"]
  },
  {
    id: "A10",
    title: "SSRF & Request Forgery",
    description: "Identify Server-Side Request Forgery vulnerabilities and suspicious parameters",
    icon: Server,
    color: "from-purple-500 to-violet-500",
    tests: ["SSRF Parameter Detection", "Request Validation", "URL Parameter Analysis"]
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

export default function FeaturesSection() {
  return (
    <section className="relative px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-purple-900/30 rounded-full border border-purple-700/30">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">OWASP Top 10 Testing</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Comprehensive Security
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Testing Suite
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Our automated scanner covers the most critical web application security risks, 
            providing detailed analysis mapped to industry-standard OWASP categories.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <motion.div key={feature.id} variants={itemVariants}>
                <Card className="group relative h-full bg-gray-900/50 border-gray-800 hover:border-gray-600 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-800/20" />
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`} />
                  
                  <CardContent className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={`relative p-3 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                          <div className="absolute inset-0 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                        <div>
                          <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            {feature.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    {/* Tests List */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Included Tests:
                      </div>
                      {feature.tests.map((test, testIndex) => (
                        <motion.div
                          key={testIndex}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * testIndex }}
                          className="flex items-center gap-2 text-sm text-gray-300"
                        >
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span>{test}</span>
                        </motion.div>
                      ))}
                    </div>
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

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <Globe className="w-4 h-4" />
            <span>Safe, non-invasive testing • No credentials required • Instant reports</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}