"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { History, Search, Calendar, Globe, Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

interface ScanHistoryItem {
  id: string;
  url: string;
  domain: string;
  status: 'completed' | 'failed' | 'running';
  createdAt: string;
  completedAt?: string;
  vulnerabilitiesFound: number;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
  testsRun: number;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredScans, setFilteredScans] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    fetchScanHistory();
  }, []);

  useEffect(() => {
    // Filter scans based on search term
    const filtered = scans.filter(scan => 
      scan.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredScans(filtered);
  }, [scans, searchTerm]);

  const fetchScanHistory = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/scans/history');
      // const data = await response.json();
      
      // Mock data for now
      const mockData: ScanHistoryItem[] = [
        {
          id: "1",
          url: "https://www.pro-contaty.com.br",
          domain: "pro-contaty.com.br",
          status: "completed",
          createdAt: "2025-01-06T10:30:00Z",
          completedAt: "2025-01-06T10:33:15Z",
          vulnerabilitiesFound: 7,
          riskScore: "high",
          testsRun: 4
        },
        {
          id: "2",
          url: "https://example.com",
          domain: "example.com",
          status: "completed",
          createdAt: "2025-01-05T15:20:00Z",
          completedAt: "2025-01-05T15:22:45Z",
          vulnerabilitiesFound: 2,
          riskScore: "medium",
          testsRun: 4
        },
        {
          id: "3",
          url: "https://secure-site.com",
          domain: "secure-site.com",
          status: "completed",
          createdAt: "2025-01-04T09:15:00Z",
          completedAt: "2025-01-04T09:17:30Z",
          vulnerabilitiesFound: 0,
          riskScore: "low",
          testsRun: 4
        }
      ];
      
      setScans(mockData);
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
          <History className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-semibold text-white">Scan History</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Search and Filters */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Search Scans
            </CardTitle>
            <CardDescription className="text-gray-400">
              Find your previous security scans by URL or domain
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

        {/* Scan History List */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Scans</CardTitle>
                <CardDescription className="text-gray-400">
                  Your security scan history and results
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
                  <p className="text-gray-400">Loading scan history...</p>
                </div>
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No scans found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? "No scans match your search criteria" : "You haven't run any scans yet"}
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
                {filteredScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-4 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(scan.status)}
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-white">{scan.url}</h3>
                            <ExternalLink className="w-3 h-3 text-gray-500" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(scan.createdAt), 'MMM d, yyyy at h:mm a')}
                            </span>
                          </div>
                          {scan.completedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Completed in {Math.round((new Date(scan.completedAt).getTime() - new Date(scan.createdAt).getTime()) / 1000)}s
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {getRiskBadge(scan.riskScore)}
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-300">{scan.testsRun} tests run</span>
                          </div>
                          {scan.vulnerabilitiesFound > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-red-300">{scan.vulnerabilitiesFound} issues found</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-300">No issues found</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/dashboard/reports/${scan.id}`}>
                          <Button variant="outline" size="sm" className="text-gray-300 border-gray-600 hover:border-purple-500 hover:text-white">
                            View Report
                          </Button>
                        </Link>
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