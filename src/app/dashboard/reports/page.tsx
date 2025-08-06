"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FileText, Search, Calendar, Download, Globe, Shield, AlertTriangle, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { useClientAuth } from "@/hooks/useClientAuth";
import type { Report } from "@/lib/db/schema";

interface ReportItem {
  id: string;
  scanId: string;
  url: string;
  domain: string;
  createdAt: string;
  vulnerabilitiesFound: number;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
  testsRun: number;
  reportSize: string;
  categories: string[];
  summary?: Report['summary'];
}

export default function ReportsPage() {
  const { user } = useClientAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReports, setFilteredReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  useEffect(() => {
    // Filter reports based on search term
    const filtered = reports.filter(report => 
      report.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [reports, searchTerm]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      } else {
        console.error('Failed to fetch reports:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskScore: string) => {
    switch (riskScore) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
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

  const handleDownloadReport = async (reportId: string, url: string) => {
    try {
      // TODO: Implement actual report download
      // const response = await fetch(`/api/reports/${reportId}/download`);
      // const blob = await response.blob();
      // const downloadUrl = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = downloadUrl;
      // a.download = `seccheck-report-${reportId}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // window.URL.revokeObjectURL(downloadUrl);
      
      // Mock download for now
      alert(`Downloading report for ${url}...`);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
          <FileText className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-semibold text-white">Security Reports</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Search and Actions */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Search Reports
            </CardTitle>
            <CardDescription className="text-gray-400">
              Find and download your security assessment reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by URL or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/50 border-gray-700 focus:border-purple-500 focus:ring-purple-500/20 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{reports.length}</p>
                  <p className="text-sm text-gray-400">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {reports.reduce((sum, report) => sum + report.vulnerabilitiesFound, 0)}
                  </p>
                  <p className="text-sm text-gray-400">Total Issues Found</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {reports.filter(r => r.riskScore === 'high' || r.riskScore === 'critical').length}
                  </p>
                  <p className="text-sm text-gray-400">High Risk Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Available Reports</CardTitle>
                <CardDescription className="text-gray-400">
                  Download and view your detailed security assessment reports
                </CardDescription>
              </div>
              <Link href="/dashboard/scan">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold">
                  New Scan
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading reports...</p>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? "No reports match your search criteria" : "You don't have any security reports yet"}
                  </p>
                  <Link href="/dashboard/scan">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold">
                      Run Your First Scan
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-white">{report.url}</h3>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(report.createdAt), 'MMM d, yyyy at h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            <span>{report.reportSize}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          {getRiskBadge(report.riskScore)}
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{report.testsRun} tests completed</span>
                          </div>
                          {report.vulnerabilitiesFound > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-red-300">{report.vulnerabilitiesFound} issues documented</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">No issues found</span>
                            </div>
                          )}
                          {report.categories.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">OWASP:</span>
                              <div className="flex gap-1">
                                {report.categories.map(category => (
                                  <Badge key={category} variant="outline" className="text-xs">
                                    {category}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/dashboard/reports/${report.scanId}`}>
                          <Button variant="outline" size="sm" className="text-gray-300 border-gray-600 hover:border-purple-500 hover:text-white">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownloadReport(report.id, report.url)}
                          className="text-gray-300 border-gray-600 hover:border-blue-500 hover:text-white"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}