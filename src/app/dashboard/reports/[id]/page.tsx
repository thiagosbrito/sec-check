"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FileText, Globe, Shield, AlertTriangle, CheckCircle, Calendar, Clock, ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";

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

interface ReportData {
  id: string;
  url: string;
  domain: string;
  createdAt: string;
  completedAt: string;
  vulnerabilitiesFound: number;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
  testsRun: number;
  results: ScanResult[];
}

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchReport(params.id as string);
    }
  }, [params.id]);

  const fetchReport = async (scanId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/report/${scanId}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockReport: ReportData = {
        id: scanId,
        url: "https://www.pro-contaty.com.br",
        domain: "pro-contaty.com.br",
        createdAt: "2025-01-06T10:30:00Z",
        completedAt: "2025-01-06T10:33:15Z",
        vulnerabilitiesFound: 7,
        riskScore: "high",
        testsRun: 4,
        results: [
          {
            testName: "security_headers_test",
            owaspCategory: "A05",
            severity: "medium",
            status: "fail",
            title: "Missing Security Headers",
            description: "Several important security headers are missing or misconfigured",
            impact: "Could allow clickjacking, MIME type sniffing, and other attacks",
            recommendation: "Implement Content-Security-Policy, X-Frame-Options, and other security headers",
            evidence: {
              missing_headers: ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options"],
              current_headers: {
                "Server": "nginx/1.18.0",
                "Content-Type": "text/html; charset=UTF-8"
              }
            },
            confidence: 90
          },
          {
            testName: "cookie_security_test",
            owaspCategory: "A07",
            severity: "high",
            status: "fail",
            title: "Insecure Cookie Configuration",
            description: "Session cookies are missing important security attributes",
            impact: "Session cookies could be stolen via XSS or transmitted over unencrypted connections",
            recommendation: "Set Secure, HttpOnly, and SameSite attributes on all session cookies",
            evidence: {
              insecure_cookies: [
                {
                  name: "PHPSESSID",
                  secure: false,
                  httponly: false,
                  samesite: "none"
                }
              ]
            },
            confidence: 95
          },
          {
            testName: "xss_reflection_test",
            owaspCategory: "A03",
            severity: "medium",
            status: "warning",
            title: "Potential XSS Reflection Detected",
            description: "URL parameters are reflected in page content without apparent encoding",
            evidence: {
              reflected_parameters: ["q=test", "search=example"],
              url: "https://www.pro-contaty.com.br"
            },
            recommendation: "Implement proper input validation and output encoding for all user inputs",
            confidence: 70
          },
          {
            testName: "mixed_content_test",
            owaspCategory: "A02",
            severity: "info",
            status: "pass",
            title: "No Mixed Content Detected",
            description: "All resources loaded over HTTPS",
            confidence: 85
          }
        ]
      };
      
      setReport(mockReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
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

  const getRiskBadge = (riskScore: string) => {
    switch (riskScore) {
      case 'critical':
        return <Badge variant="destructive">Critical Risk</Badge>;
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Risk</Badge>;
      case 'low':
        return <Badge variant="outline">Low Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
            <FileText className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-semibold text-white">Loading Report...</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Clock className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading security report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
            <FileText className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-semibold text-white">Report Not Found</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Report Not Found</h3>
            <p className="text-gray-400 mb-4">{error || "The requested security report could not be found."}</p>
            <Link href="/dashboard/reports">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold">
                Back to Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const vulnerabilitiesFound = report.results.filter(r => r.status === 'fail' || r.status === 'warning').length;
  const totalChecks = report.results.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
          <Link href="/dashboard/reports" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <FileText className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-semibold text-white">Security Report</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Report Header */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  {report.url}
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </CardTitle>
                <CardDescription className="text-gray-400 mb-4">
                  Security assessment completed on {format(new Date(report.completedAt), 'MMMM d, yyyy at h:mm a')}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">
                      Scan duration: {Math.round((new Date(report.completedAt).getTime() - new Date(report.createdAt).getTime()) / 1000)}s
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{report.testsRun} security tests</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRiskBadge(report.riskScore)}
                <Button variant="outline" className="text-gray-300 border-gray-600 hover:border-blue-500 hover:text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white mb-2">{totalChecks}</div>
              <div className="text-sm text-gray-400">Total Security Checks</div>
            </CardContent>
          </Card>
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-400 mb-2">{vulnerabilitiesFound}</div>
              <div className="text-sm text-gray-400">Issues Identified</div>
            </CardContent>
          </Card>
          <Card className="bg-green-900/20 border-green-800">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">{totalChecks - vulnerabilitiesFound}</div>
              <div className="text-sm text-gray-400">Tests Passed</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Detailed Security Assessment</CardTitle>
            <CardDescription className="text-gray-400">
              Complete breakdown of all security tests and findings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.results.map((result, index) => (
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
    </div>
  );
}