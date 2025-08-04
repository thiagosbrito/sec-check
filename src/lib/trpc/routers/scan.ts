import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { scans, scanResults } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const scanRouter = createTRPCRouter({
  // Create a new scan
  create: publicProcedure
    .input(z.object({
      url: z.string().url(),
      userId: z.string().uuid().optional(),
      isPublicScan: z.boolean().default(true),
    }))
    .output(z.object({
      id: z.string(),
      url: z.string(),
      status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
      createdAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Extract domain from URL
      const domain = new URL(input.url).hostname;

      const [scan] = await ctx.db
        .insert(scans)
        .values({
          url: input.url,
          domain,
          userId: input.userId || null,
          isPublicScan: input.isPublicScan,
          status: 'pending',
        })
        .returning({
          id: scans.id,
          url: scans.url,
          status: scans.status,
          createdAt: scans.createdAt,
        });

      return scan;
    }),

  // Get scan by ID
  getById: publicProcedure
    .input(z.object({ 
      scanId: z.string().uuid() 
    }))
    .output(z.object({
      id: z.string(),
      url: z.string(),
      domain: z.string(),
      status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
      startedAt: z.date().nullable(),
      completedAt: z.date().nullable(),
      createdAt: z.date(),
      totalVulnerabilities: z.number().nullable(),
      criticalCount: z.number().nullable(),
      highCount: z.number().nullable(),
      mediumCount: z.number().nullable(),
      lowCount: z.number().nullable(),
      infoCount: z.number().nullable(),
    }))
    .query(async ({ ctx, input }) => {
      const [scan] = await ctx.db
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
        })
        .from(scans)
        .where(eq(scans.id, input.scanId))
        .limit(1);

      if (!scan) {
        throw new Error('Scan not found');
      }

      return scan;
    }),

  // Get user's scans
  getUserScans: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .output(z.object({
      scans: z.array(z.object({
        id: z.string(),
        url: z.string(),
        domain: z.string(),
        status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
        createdAt: z.date(),
        totalVulnerabilities: z.number().nullable(),
      })),
      total: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const userScans = await ctx.db
        .select({
          id: scans.id,
          url: scans.url,
          domain: scans.domain,
          status: scans.status,
          createdAt: scans.createdAt,
          totalVulnerabilities: scans.totalVulnerabilities,
        })
        .from(scans)
        .where(eq(scans.userId, input.userId))
        .orderBy(desc(scans.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(eq(scans.userId, input.userId));

      return {
        scans: userScans,
        total: count,
      };
    }),

  // Get scan results
  getResults: publicProcedure
    .input(z.object({
      scanId: z.string().uuid(),
    }))
    .output(z.object({
      results: z.array(z.object({
        id: z.string(),
        testName: z.string(),
        owaspCategory: z.enum(['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10']),
        severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
        status: z.string(),
        title: z.string(),
        description: z.string(),
        impact: z.string().nullable(),
        recommendation: z.string().nullable(),
        evidence: z.any().nullable(),
        technicalDetails: z.any().nullable(),
        references: z.any().nullable(),
        confidence: z.number().nullable(),
        createdAt: z.date(),
      })),
    }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
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
        .where(eq(scanResults.scanId, input.scanId))
        .orderBy(desc(scanResults.createdAt));

      return {
        results,
      };
    }),
});