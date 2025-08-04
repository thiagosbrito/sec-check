"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Scan, AlertTriangle, CheckCircle, Clock, Globe, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface VulnerabilityResult {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  found: boolean;
  details?: string;
}

const mockVulnerabilityChecks: VulnerabilityResult[] = [
  {
    id: "https",
    name: "HTTPS Enforcement",
    severity: "high",
    description: "Checks if the website enforces HTTPS connections",
    found: false,
  },
  {
    id: "headers",
    name: "Security Headers",
    severity: "medium",
    description: "Validates presence of security headers (CSP, HSTS, X-Frame-Options)",
    found: false,
  },
  {
    id: "cookies",
    name: "Secure Cookies",
    severity: "medium",
    description: "Checks if cookies have Secure and HttpOnly flags",
    found: false,
  },
  {
    id: "mixed-content",
    name: "Mixed Content",
    severity: "high",
    description: "Detects HTTP resources loaded on HTTPS pages",
    found: false,
  },
  {
    id: "xss-protection",
    name: "XSS Protection",
    severity: "high",
    description: "Checks for XSS protection headers and basic vulnerabilities",
    found: false,
  },
];

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<VulnerabilityResult[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);

  const handleScan = async () => {
    if (!url) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanCompleted(false);
    setResults([]);

    // Simulate scanning progress
    const checks = [...mockVulnerabilityChecks];
    const totalChecks = checks.length;

    for (let i = 0; i < totalChecks; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate check time
      
      // Simulate some random results
      const check = { ...checks[i] };
      check.found = Math.random() > 0.7; // 30% chance of finding an issue
      
      if (check.found) {
        check.details = getRandomDetails(check.id);
      }

      setResults(prev => [...prev, check]);
      setScanProgress(((i + 1) / totalChecks) * 100);
    }

    setIsScanning(false);
    setScanCompleted(true);
  };

  const getRandomDetails = (checkId: string): string => {
    const details = {
      https: "Website is accessible via HTTP without redirecting to HTTPS",
      headers: "Missing Content-Security-Policy and X-Frame-Options headers",
      cookies: "Session cookies found without Secure flag",
      "mixed-content": "HTTP resources detected: images and stylesheets",
      "xss-protection": "Missing X-XSS-Protection header"
    };
    return details[checkId as keyof typeof details] || "Potential security issue detected";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      case "info": return "outline";
      default: return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const vulnerabilitiesFound = results.filter(r => r.found).length;
  const totalChecks = results.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
          <Scan className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-semibold text-white">Security Scan</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Scan Input */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Website Security Scanner
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter a website URL to scan for common security vulnerabilities based on OWASP Top 10
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
                  disabled={isScanning}
                />
              </div>
              <Button
                onClick={handleScan}
                disabled={!url || isScanning}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8"
              >
                {isScanning ? (
                  <>
                    <Scan className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scanning Progress */}
        {isScanning && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400 animate-pulse" />
                Scanning in Progress
              </CardTitle>
              <CardDescription className="text-gray-400">
                Running security checks on {url}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={scanProgress} className="w-full" />
                <p className="text-sm text-gray-400">
                  Completed {results.length} of {mockVulnerabilityChecks.length} security checks
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan Results */}
        {(results.length > 0 || scanCompleted) && (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Scan Results
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Security assessment for {url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gray-800/50">
                    <div className="text-2xl font-bold text-white">{totalChecks}</div>
                    <div className="text-sm text-gray-400">Total Checks</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-900/20">
                    <div className="text-2xl font-bold text-red-400">{vulnerabilitiesFound}</div>
                    <div className="text-sm text-gray-400">Issues Found</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-900/20">
                    <div className="text-2xl font-bold text-green-400">{totalChecks - vulnerabilitiesFound}</div>
                    <div className="text-sm text-gray-400">Passed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Detailed Results</CardTitle>
                <CardDescription className="text-gray-400">
                  Individual security check results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className={`p-4 rounded-lg border ${
                        result.found
                          ? "bg-red-900/20 border-red-800"
                          : "bg-green-900/20 border-green-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getSeverityIcon(result.severity)}
                            <h3 className="font-semibold text-white">{result.name}</h3>
                            <Badge variant={getSeverityColor(result.severity)}>
                              {result.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{result.description}</p>
                          {result.found && result.details && (
                            <p className="text-red-300 text-sm font-medium">{result.details}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          {result.found ? (
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}