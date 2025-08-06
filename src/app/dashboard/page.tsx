"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scan, FileText, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useClientAuth } from "@/hooks/useClientAuth";

interface UsageStats {
  user: {
    plan: string;
    scanLimit: number;
  };
  usage: {
    today: {
      scans: number;
      remaining: number;
      limit: number;
      percentage: number;
    };
    total: {
      scans: number;
      vulnerabilities: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
    };
  };
  resetTime: string;
}

function DashboardContent() {
  const { user } = useClientAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if there's a redirectUrl parameter and redirect to scan page
  useEffect(() => {
    const redirectUrl = searchParams.get('redirectUrl');
    if (redirectUrl && user) {
      router.push(`/dashboard/scan?url=${encodeURIComponent(redirectUrl)}`);
    }
  }, [searchParams, user, router]);

  // Fetch usage statistics
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/usage');
        const data = await response.json();
        
        if (data.success) {
          setUsageStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 text-gray-300 hover:text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="ml-auto px-4">
          <div className="text-sm text-gray-300">
            Welcome, {user?.user_metadata?.name || user?.email?.split('@')[0]}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Welcome section */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Overview</h2>
          <p className="text-gray-400">
            Manage your security scans and monitor your web applications
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Scans Card with Usage Limit */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Daily Scans</CardTitle>
              <Scan className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-gray-500">...</div>
              ) : usageStats?.usage.total.scans === 0 ? (
                <>
                  <div className="text-2xl font-bold text-white">0</div>
                  <p className="text-xs text-gray-400">No scans yet</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {usageStats?.usage.today.scans || 0} / {usageStats?.usage.today.limit || 10}
                  </div>
                  <div className="space-y-2">
                    <Progress 
                      value={usageStats?.usage.today.percentage || 0} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-400">
                      {usageStats?.usage.today.remaining || 0} remaining today
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Vulnerabilities Card with Real Data */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Vulnerabilities Found</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-gray-500">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {usageStats?.usage.total.vulnerabilities.total || 0}
                  </div>
                  {usageStats?.usage.total.scans === 0 ? (
                    <p className="text-xs text-gray-400">Start scanning to see results</p>
                  ) : (
                    <div className="text-xs text-gray-400 space-y-1">
                      {(usageStats?.usage.total.vulnerabilities.critical ?? 0) > 0 && (
                        <div className="text-red-400">
                          {usageStats?.usage.total.vulnerabilities.critical} Critical
                        </div>
                      )}
                      {(usageStats?.usage.total.vulnerabilities.high ?? 0) > 0 && (
                        <div className="text-orange-400">
                          {usageStats?.usage.total.vulnerabilities.high} High
                        </div>
                      )}
                      {(usageStats?.usage.total.vulnerabilities.medium ?? 0) > 0 && (
                        <div className="text-yellow-400">
                          {usageStats?.usage.total.vulnerabilities.medium} Medium
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Scans Card */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Scans</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold text-gray-500">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {usageStats?.usage.total.scans || 0}
                  </div>
                  <p className="text-xs text-gray-400">
                    {usageStats?.usage.total.scans === 0 
                      ? "No scans yet" 
                      : `${usageStats?.user.plan.toUpperCase()} plan`
                    }
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Scan className="w-5 h-5 text-purple-400" />
                Start New Scan
              </CardTitle>
              <CardDescription className="text-gray-400">
                Scan a website for OWASP Top 10 vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/scan">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Start Scan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                View Analytics
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monitor security trends and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border-gray-700 bg-black/50 hover:bg-gray-800 text-white"
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Your latest security scans and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No activity yet</p>
              <p className="text-sm text-gray-500">
                Start your first security scan to see activity here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}