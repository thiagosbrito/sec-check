"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Scan, Lock, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroSection() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleScan = async () => {
    if (!url) return;
    
    // Check if user is authenticated
    if (!user) {
      // Redirect to sign-up with the URL as a query parameter
      const encodedUrl = encodeURIComponent(url);
      router.push(`/sign-up?redirectUrl=${encodedUrl}`);
      return;
    }
    
    // User is authenticated, redirect to scan page with URL
    const encodedUrl = encodeURIComponent(url);
    router.push(`/dashboard/scan?url=${encodedUrl}`);
  };

  return (
    <section className="relative px-6 pt-20 pb-16 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <motion.div
              className="relative"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
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
          transition={{ duration: 0.8, delay: 0.2 }}
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
          transition={{ duration: 0.8, delay: 0.4 }}
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
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                    <Lock className="w-5 h-5 text-gray-500" />
                  </div>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-14 text-lg bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white placeholder:text-gray-400 pl-12"
                    disabled={isScanning}
                  />
                </div>
                <Button
                  onClick={handleScan}
                  disabled={!url || isScanning}
                  className="h-14 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isScanning ? (
                    <motion.div
                      className="flex items-center gap-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Scan className="w-5 h-5" />
                      Scanning...
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Start Scan
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Quick info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
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