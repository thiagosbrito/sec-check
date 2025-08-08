"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { URLInput } from "@/components/ui/url-input";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { variants, springs, durations, hoverAnimations } from "@/lib/animations";

export default function HeroSection() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleScan = async (normalizedUrl: string) => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to sign-up with the URL as a query parameter
      const encodedUrl = encodeURIComponent(normalizedUrl);
      router.push(`/sign-up?redirectUrl=${encodedUrl}`);
      return;
    }
    
    // User is authenticated, redirect to scan page with URL
    const encodedUrl = encodeURIComponent(normalizedUrl);
    router.push(`/dashboard/scan?url=${encodedUrl}`);
  };

  return (
    <section className="relative px-6 pt-20 pb-16 lg:px-8" data-testid="hero-section">
      <div className="mx-auto max-w-4xl text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={durations.page}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <motion.div
              className="relative"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Shield className="w-12 h-12 text-purple-400" />
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              SecCheck
            </h1>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...durations.page, delay: 0.2 }}
          className="text-5xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Secure Your Web
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            In Seconds
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...durations.page, delay: 0.4 }}
          className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Professional-grade automated security testing that scans your website for vulnerabilities 
          using <span className="text-purple-400 font-semibold">OWASP Top 10</span> methodologies. 
          Get detailed reports with actionable remediation steps in minutes.
        </motion.p>

        {/* URL Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...durations.page, delay: 0.6 }}
          className="mb-16"
        >
          <URLInput
            value={url}
            onChange={setUrl}
            onSubmit={handleScan}
            placeholder="https://example.com"
            disabled={isScanning}
            isLoading={isScanning}
            loadingText="Scanning..."
            submitText="Start Scan"
            variant="hero"
          />
          
          {/* Quick info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, ...durations.slow }}
            className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Safe & Non-invasive
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              OWASP Top 10
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Instant Results
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}