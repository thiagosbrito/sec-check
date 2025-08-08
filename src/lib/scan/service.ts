/**
 * Main scan service
 * Orchestrates the complete scan workflow
 */

import { ScanValidationService } from './validation';
import { ScanLimitService } from './limits';
import { UsageTrackingService } from './usage';
import { ScanRepository, type CreateScanData, type ScanRecord } from './repository';
import { addScanJob } from '@/lib/queue/queue';
import { planEnforcementService } from '@/lib/billing/enforcement';

export interface ScanRequest {
  url: string;
  userId?: string | null;
  isPublicScan?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface ScanResult {
  success: boolean;
  data?: {
    scanId: string;
    jobId: string;
    url: string;
    domain: string;
    status: string;
    createdAt: Date;
    estimatedCompletionTime: string;
  };
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ScanService {
  /**
   * Processes a complete scan request
   */
  static async processScanRequest(request: ScanRequest): Promise<ScanResult> {
    try {
      // Extract domain from URL
      const url = new URL(request.url);
      const domain = url.hostname;
      
      // Determine user ID and scan type
      const userId = request.userId || null;
      const isPublicScan = !request.userId || Boolean(request.isPublicScan);

      // 1. Validate URL
      const validation = ScanValidationService.validateUrl(request.url);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          code: validation.code,
        };
      }

      // 2. Check limits for authenticated users
      if (request.userId) {
        // Check daily scan limit
        const limitCheck = await ScanLimitService.checkDailyLimit(request.userId);
        
        if (!limitCheck.allowed) {
          return {
            success: false,
            error: `Daily scan limit reached. You've used all ${limitCheck.limit} scans for today. Limit resets at midnight.`,
            code: 'DAILY_LIMIT_EXCEEDED',
            details: {
              limit: limitCheck.limit,
              used: limitCheck.limit,
              remaining: 0,
              resetTime: 'midnight'
            }
          };
        }

        // Check plan limits through billing enforcement
        const planCheck = await planEnforcementService.checkScanLimit(request.userId);
        if (!planCheck.allowed) {
          return {
            success: false,
            error: planCheck.reason,
            code: 'PLAN_LIMIT_EXCEEDED'
          };
        }

        // Check for duplicate recent scans
        const duplicateCheck = await ScanLimitService.checkDuplicateScan(request.userId, request.url);
        if (duplicateCheck.isDuplicate) {
          return {
            success: false,
            error: 'Duplicate scan detected. Please wait 5 minutes before scanning the same URL again.',
            code: 'DUPLICATE_SCAN',
            details: {
              waitTime: duplicateCheck.waitTime,
              lastScanId: duplicateCheck.scanId
            }
          };
        }
      }

      // 3. Create scan record
      const scanData: CreateScanData = {
        url: request.url,
        domain,
        userId,
        isPublicScan,
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
      };

      const scan = await ScanRepository.createScan(scanData);

      // 4. Add job to scan queue
      const job = await addScanJob({
        scanId: scan.id,
        url: request.url,
        domain,
        userId,
        isPublicScan: isPublicScan,
        scanConfig: {
          timeout: 30000,
          followRedirects: true,
          maxRedirects: 5,
          browserTimeout: 30000,
        },
      });

      // 5. Update scan with job ID
      await ScanRepository.updateScanConfig(scan.id, { jobId: job.id || '' });

      // 6. Update usage stats for authenticated users
      if (request.userId) {
        await UsageTrackingService.updateUsageStats(request.userId);
        await planEnforcementService.trackScanUsage(request.userId);
      }

      return {
        success: true,
        data: {
          scanId: scan.id,
          jobId: job.id || '',
          url: scan.url,
          domain: scan.domain,
          status: scan.status,
          createdAt: scan.createdAt,
          estimatedCompletionTime: '1-3 minutes',
        },
      };

    } catch (error) {
      console.error('Scan service error:', error);
      return {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
    }
  }
}
