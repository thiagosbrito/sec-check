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
import { is } from "drizzle-orm";
import Loader from "@/components/Loader";
import LiveBrowserView from "@/components/LiveBrowserView";

interface ScanResult {
  testName: string;
  owaspCategory: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "pass" | "fail" | "warning" | "error";
  title: string;
  description: string;
  impact?: string;
  recommendation?: string;
  evidence?: Record<string, unknown>;
  technicalDetails?: Record<string, unknown>;
  references?: string[];
  confidence?: number;
}

interface ScanResponse {
  scanId: string;
  jobId: string;
  url: string;
  domain: string;
  status: string;
  createdAt: string;
  estimatedCompletionTime: string;
}

interface ScanProgress {
  stage: 'initializing' | 'analyzing' | 'testing' | 'reporting' | 'completed';
  completedTests: number;
  totalTests: number;
  currentTest?: string;
  message?: string;
  percentage: number;
}

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [scanResponse, setScanResponse] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url) return;

    setIsScanning(true);
    setScanProgress(null);
    setScanCompleted(false);
    setResults([]);
    setError(null);
    setScanResponse(null);

    try {
      // Start the scan
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          isPublicScan: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start scan');
      }

      const scanData: { success: boolean; data: ScanResponse } = await response.json();
      setScanResponse(scanData.data);

      // Poll for scan results
      await pollScanResults(scanData.data.scanId);

    } catch (error) {
      console.error('Scan failed:', error);
      setError(error instanceof Error ? error.message : 'Scan failed');
      setIsScanning(false);
    }
  };

  const pollScanResults = async (scanId: string) => {
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/report/${scanId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Scan not found or not completed yet
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(poll, 5000); // Poll every 5 seconds
              return;
            } else {
              throw new Error('Scan timeout - results not available');
            }
          }
          throw new Error('Failed to fetch scan results');
        }

        const reportData = await response.json();
        
        if (reportData.success && reportData.data) {
          const { scan, results, progress } = reportData.data;
          
          // Update progress if available
          if (progress) {
            setScanProgress(progress);
          }
          
          if (scan.status === 'completed') {
            setResults(results || []);
            setScanCompleted(true);
            setIsScanning(false);
          } else if (scan.status === 'failed') {
            throw new Error('Scan failed: ' + (scan.errorMessage || 'Unknown error'));
          } else {
            // Still running, continue polling
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(poll, 5000);
            } else {
              throw new Error('Scan timeout');
            }
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setError(error instanceof Error ? error.message : 'Failed to get scan results');
        setIsScanning(false);
      }
    };

    // Start polling
    setTimeout(poll, 5000); // Initial delay
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

  const vulnerabilitiesFound = results.filter(r => r.status === 'fail' || r.status === 'warning').length;
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

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Scan Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Scanning Progress */}
        {isScanning && !error && (
          <>
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
                  <Progress value={scanProgress?.percentage} className="w-full" />
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-sm text-gray-400">
                      {scanResponse ? 
                        `Scan ID: ${scanResponse.scanId} - Estimated completion: ${scanResponse.estimatedCompletionTime}` :
                        'Initializing scan...'
                      }
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    This may take 1-3 minutes to complete. The page will automatically update when results are ready.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Browser View */}
            {scanResponse && (
              <LiveBrowserView 
                scanId={scanResponse.scanId} 
                isScanning={isScanning} 
              />
            )}

            <div className="flex-1 flex items-center justify-center">
              <Loader />
            </div>
          </>
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
                  {results.map((result, index) => (
                    <div
                      key={`${result.testName}-${index}`}
                      className={`p-4 rounded-lg border ${
                        result.status === 'fail' || result.status === 'warning'
                          ? "bg-red-900/20 border-red-800"
                          : "bg-green-900/20 border-green-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getSeverityIcon(result.severity)}
                            <h3 className="font-semibold text-white">{result.title}</h3>
                            <Badge variant={getSeverityColor(result.severity)}>
                              {result.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {result.owaspCategory}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{result.description}</p>
                          {result.impact && (
                            <p className="text-yellow-300 text-sm mb-2">
                              <strong>Impact:</strong> {result.impact}
                            </p>
                          )}
                          {result.recommendation && (
                            <p className="text-blue-300 text-sm mb-2">
                              <strong>Recommendation:</strong> {result.recommendation}
                            </p>
                          )}
                          {result.evidence && Object.keys(result.evidence).length > 0 && (
                            <div className="mt-2 p-3 bg-gray-800/50 rounded-lg text-xs border border-gray-700">
                              <strong className="text-gray-300 block mb-3">Evidence:</strong>
                              <div className="space-y-3">
                                {Object.entries(result.evidence).map(([key, value]) => (
                                  <div key={key} className="border-l-3 border-blue-500/50 pl-3">
                                    <div className="text-blue-300 font-mono text-xs mb-2 font-semibold">{key}:</div>
                                    <div className="text-gray-300 whitespace-pre-wrap break-words text-xs font-mono leading-relaxed bg-gray-900/80 p-3 rounded border border-gray-600/50">
                                      {typeof value === 'string' 
                                        ? value.replace(/\\n/g, '\n')
                                        : JSON.stringify(value, null, 2)
                                      }
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {result.confidence && result.confidence < 100 && (
                            <p className="text-gray-500 text-xs mt-2">
                              Confidence: {result.confidence}%
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {result.status === 'fail' || result.status === 'warning' ? (
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