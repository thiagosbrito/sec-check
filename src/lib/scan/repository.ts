/**
 * Scan repository
 * Handles database operations for scans
 */

import { db } from '@/lib/db/connection';
import { scans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateScanData {
  url: string;
  domain: string;
  userId: string | null;
  isPublicScan: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface ScanRecord {
  id: string;
  url: string;
  domain: string;
  status: string;
  createdAt: Date;
}

export interface ScanConfigUpdate {
  jobId: string;
}

export class ScanRepository {
  /**
   * Creates a new scan record in the database
   */
  static async createScan(data: CreateScanData): Promise<ScanRecord> {
    const [scan] = await db
      .insert(scans)
      .values({
        url: data.url,
        domain: data.domain,
        userId: data.userId,
        isPublicScan: data.isPublicScan,
        status: 'pending',
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      })
      .returning({
        id: scans.id,
        url: scans.url,
        domain: scans.domain,
        status: scans.status,
        createdAt: scans.createdAt,
      });

    return scan;
  }

  /**
   * Updates a scan with job configuration
   */
  static async updateScanConfig(scanId: string, config: ScanConfigUpdate): Promise<void> {
    await db
      .update(scans)
      .set({
        scanConfig: { jobId: config.jobId },
        status: 'pending',
      })
      .where(eq(scans.id, scanId));
  }

  /**
   * Gets a scan by ID
   */
  static async getScanById(scanId: string): Promise<ScanRecord | null> {
    const [scan] = await db
      .select({
        id: scans.id,
        url: scans.url,
        domain: scans.domain,
        status: scans.status,
        createdAt: scans.createdAt,
      })
      .from(scans)
      .where(eq(scans.id, scanId))
      .limit(1);

    return scan || null;
  }
}
