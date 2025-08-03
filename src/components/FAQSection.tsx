"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Is SecCheck safe to use on my production website?",
    answer: "Yes, absolutely. SecCheck uses only passive and safe active testing methods. We never attempt to exploit vulnerabilities or cause any damage to your website. Our tests are designed to detect security issues without impacting your site's functionality or data."
  },
  {
    question: "What types of vulnerabilities does SecCheck detect?",
    answer: "SecCheck tests for the OWASP Top 10 security risks including injection flaws, broken authentication, sensitive data exposure, XML external entities, broken access control, security misconfigurations, cross-site scripting, insecure deserialization, vulnerable components, and insufficient logging & monitoring."
  },
  {
    question: "How long does a security scan take?",
    answer: "Most scans complete within 2-5 minutes depending on your website's size and complexity. Our automated testing runs in parallel to provide fast results while maintaining thoroughness."
  },
  {
    question: "Do I need to install anything on my website?",
    answer: "No installation required. SecCheck works by analyzing your publicly accessible website from the outside, just like a real attacker would. For domain verification (Pro plan), you may need to upload a simple HTML file or add a DNS record."
  },
  {
    question: "What's included in the security report?",
    answer: "Our reports include detailed vulnerability descriptions, risk ratings, evidence of findings, and step-by-step remediation instructions. Each issue is mapped to OWASP categories with clear explanations for both technical and non-technical audiences."
  },
  {
    question: "Can I scan websites I don't own?",
    answer: "You can scan any publicly accessible website for basic reconnaissance, but detailed vulnerability testing requires domain verification to ensure you have permission to test the website. This protects against unauthorized scanning."
  },
  {
    question: "How does SecCheck compare to other security scanners?",
    answer: "SecCheck focuses specifically on OWASP Top 10 vulnerabilities with an emphasis on actionable results. Unlike complex enterprise tools, we provide clear, prioritized findings that developers can immediately act upon, with no false positives from misconfigured scans."
  },
  {
    question: "Is there an API available?",
    answer: "Yes, Pro and Enterprise plans include REST API access for automated scanning integration. You can trigger scans, retrieve reports, and manage your account programmatically. API documentation is available in your dashboard."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  }
};

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section id="faq" className="relative px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl">
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
              Frequently Asked
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about SecCheck&apos;s security testing platform.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(index);
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group bg-gray-900/50 border-gray-800 hover:border-gray-600 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleItem(index)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors duration-200"
                    >
                      <h3 className="text-lg font-semibold text-white pr-8 leading-relaxed">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        {isOpen ? (
                          <Minus className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Plus className="w-5 h-5 text-purple-400" />
                        )}
                      </motion.div>
                    </button>
                    
                    <motion.div
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
                        <p className="text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-4">
            Still have questions?
          </p>
          <a 
            href="mailto:support@seccheck.com"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Contact our support team →
          </a>
        </motion.div>
      </div>
    </section>
  );
}