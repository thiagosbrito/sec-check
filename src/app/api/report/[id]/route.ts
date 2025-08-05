import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { scans, scanResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getScanJobStatus } from '@/lib/queue/queue';

// Route params schema
const paramsSchema = z.object({
  id: z.string().uuid('Invalid scan ID format'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate scan ID
    const resolvedParams = await params;
    const { id: scanId } = paramsSchema.parse(resolvedParams);

    // Get scan details
    const [scan] = await db
      .select({
        id: scans.id,
        url: scans.url,
        domain: scans.domain,
        status: scans.status,
        startedAt: scans.startedAt,
        completedAt: scans.completedAt,
        createdAt: scans.createdAt,
        totalVulnerabilities: scans.totalVulnerabilities,
        criticalCount: scans.criticalCount,
        highCount: scans.highCount,
        mediumCount: scans.mediumCount,
        lowCount: scans.lowCount,
        infoCount: scans.infoCount,
        errorMessage: scans.errorMessage,
        scanConfig: scans.scanConfig,
      })
      .from(scans)
      .where(eq(scans.id, scanId))
      .limit(1);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Get job status if available
    let jobStatus = null;
    if (scan.scanConfig && typeof scan.scanConfig === 'object' && 'jobId' in scan.scanConfig) {
      const jobId = scan.scanConfig.jobId;
      if (jobId) {
        jobStatus = await getScanJobStatus(jobId as string);
      }
    }

    // Get scan results
    const results = await db
      .select({
        id: scanResults.id,
        testName: scanResults.testName,
        owaspCategory: scanResults.owaspCategory,
        severity: scanResults.severity,
        status: scanResults.status,
        title: scanResults.title,
        description: scanResults.description,
        impact: scanResults.impact,
        recommendation: scanResults.recommendation,
        evidence: scanResults.evidence,
        technicalDetails: scanResults.technicalDetails,
        references: scanResults.references,
        confidence: scanResults.confidence,
        createdAt: scanResults.createdAt,
      })
      .from(scanResults)
      .where(eq(scanResults.scanId, scanId))
      .orderBy(desc(scanResults.createdAt));

    // Determine current status
    let currentStatus = scan.status;
    let progress = null;

    if (jobStatus) {
      if (jobStatus.state === 'active') {
        currentStatus = 'running';
        progress = jobStatus.progress || { percentage: 0, stage: 'initializing' };
      } else if (jobStatus.state === 'completed') {
        currentStatus = 'completed';
      } else if (jobStatus.state === 'failed') {
        currentStatus = 'failed';
      }
    }

    // Build response
    const response = {
      success: true,
      data: {
        scan: {
          id: scan.id,
          url: scan.url,
          domain: scan.domain,
          status: currentStatus,
          startedAt: scan.startedAt,
          completedAt: scan.completedAt,
          createdAt: scan.createdAt,
          errorMessage: scan.errorMessage,
        },
        summary: {
          totalVulnerabilities: scan.totalVulnerabilities || 0,
          severityBreakdown: {
            critical: scan.criticalCount || 0,
            high: scan.highCount || 0,
            medium: scan.mediumCount || 0,
            low: scan.lowCount || 0,
            info: scan.infoCount || 0,
          },
        },
        results: results.map(result => ({
          id: result.id,
          testName: result.testName,
          owaspCategory: result.owaspCategory,
          severity: result.severity,
          status: result.status,
          title: result.title,
          description: result.description,
          impact: result.impact,
          recommendation: result.recommendation,
          evidence: result.evidence,
          technicalDetails: result.technicalDetails,
          references: result.references,
          confidence: result.confidence,
          createdAt: result.createdAt,
        })),
        progress,
        jobStatus: jobStatus ? {
          state: jobStatus.state,
          finishedOn: jobStatus.finishedOn,
          processedOn: jobStatus.processedOn,
          failedReason: jobStatus.failedReason,
        } : null,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Report API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid scan ID format',
          details: error.issues.map((e: { message: string }) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}