"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scan, FileText, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useClientAuth } from "@/hooks/useClientAuth";

function DashboardContent() {
  const { user } = useClientAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if there's a redirectUrl parameter and redirect to scan page
  useEffect(() => {
    const redirectUrl = searchParams.get('redirectUrl');
    if (redirectUrl && user) {
      router.push(`/dashboard/scan?url=${encodeURIComponent(redirectUrl)}`);
    }
  }, [searchParams, user, router]);

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
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Scans</CardTitle>
              <Scan className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-400">No scans yet</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Vulnerabilities Found</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-400">Start scanning to see results</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-400">No reports available</p>
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