import { NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { reports, scans } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all reports for the user's completed scans
    const userReports = await db
      .select({
        // Report data
        reportId: reports.id,
        scanId: reports.scanId,
        summary: reports.summary,
        content: reports.content,
        generatedAt: reports.generatedAt,
        format: reports.format,
        fileSize: reports.fileSize,
        
        // Scan data
        url: scans.url,
        domain: scans.domain,
        status: scans.status,
        completedAt: scans.completedAt,
        createdAt: scans.createdAt,
        totalVulnerabilities: scans.totalVulnerabilities,
        criticalCount: scans.criticalCount,
        highCount: scans.highCount,
        mediumCount: scans.mediumCount,
        lowCount: scans.lowCount,
        infoCount: scans.infoCount,
      })
      .from(reports)
      .leftJoin(scans, eq(reports.scanId, scans.id))
      .where(
        and(
          eq(scans.userId, user.id),
          eq(scans.status, 'completed')
        )
      )
      .orderBy(desc(reports.generatedAt));

    // Transform the data to match the frontend interface
    const transformedReports = userReports.map(report => ({
      id: report.reportId,
      scanId: report.scanId,
      url: report.url || '',
      domain: report.domain || '',
      createdAt: report.generatedAt?.toISOString() || report.completedAt?.toISOString() || report.createdAt?.toISOString() || '',
      vulnerabilitiesFound: report.totalVulnerabilities || 0,
      riskScore: calculateRiskScore({
        critical: report.criticalCount || 0,
        high: report.highCount || 0,
        medium: report.mediumCount || 0,
        low: report.lowCount || 0,
      }),
      testsRun: getTestsRun(report.content),
      reportSize: formatFileSize(report.fileSize || calculateReportSize(report.content)),
      categories: getOwaspCategories(report.content),
      summary: report.summary,
    }));

    return NextResponse.json({
      success: true,
      data: transformedReports,
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// Helper function to calculate risk score based on vulnerability counts
function calculateRiskScore(counts: { critical: number; high: number; medium: number; low: number }): 'low' | 'medium' | 'high' | 'critical' {
  if (counts.critical > 0) return 'critical';
  if (counts.high > 0) return 'high';
  if (counts.medium > 0) return 'medium';
  return 'low';
}

// Helper function to get number of tests run from report content
function getTestsRun(content: any): number {
  if (!content || typeof content !== 'object') return 0;
  
  // Try to get from results array
  if (content.results && Array.isArray(content.results)) {
    return content.results.length;
  }
  
  // Default number of tests in our security suite
  return 10;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper function to calculate report size from content
function calculateReportSize(content: any): number {
  if (!content) return 1024; // 1KB default
  
  // Estimate size based on JSON string length
  const jsonString = JSON.stringify(content);
  return jsonString.length * 2; // Rough estimate including formatting
}

// Helper function to extract OWASP categories from report content
function getOwaspCategories(content: any): string[] {
  if (!content || typeof content !== 'object') return [];
  
  const categories = new Set<string>();
  
  // Extract from results if available
  if (content.results && Array.isArray(content.results)) {
    content.results.forEach((result: any) => {
      if (result.owaspCategory && result.status === 'fail') {
        categories.add(result.owaspCategory);
      }
    });
  }
  
  return Array.from(categories).sort();
}