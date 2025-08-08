/**
 * Tests for POST /api/scan endpoint (refactored version)
 * Tests the clean service-based architecture
 */
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/scan/route'
import { testUsers } from '../__fixtures__/users'
import { ScanService } from '@/lib/scan'

// Mock the scan service
jest.mock('@/lib/scan', () => ({
  ScanService: {
    processScanRequest: jest.fn(),
  },
}))

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockScanService = ScanService as jest.Mocked<typeof ScanService>

// Import the createClient mock
import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCreateClient.mockResolvedValue(mockSupabaseClient as any)
})

describe('/api/scan', () => {
  describe('POST /api/scan', () => {
    it('processes valid scan requests for authenticated users', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUsers.developerUser },
        error: null,
      })

      // Mock successful scan service response
      mockScanService.processScanRequest.mockResolvedValue({
        success: true,
        data: {
          scanId: 'scan-123',
          jobId: 'job-456',
          url: 'https://example.com',
          domain: 'example.com',
          status: 'pending',
          createdAt: new Date(),
          estimatedCompletionTime: '1-3 minutes',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.scanId).toBe('scan-123')
      
      // Verify scan service was called with correct parameters
      expect(mockScanService.processScanRequest).toHaveBeenCalledWith({
        url: 'https://example.com',
        userId: testUsers.developerUser.id,
        isPublicScan: undefined,
        userAgent: undefined,
        ipAddress: 'unknown',
      })
    })

    it('processes public scans for unauthenticated users', async () => {
      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Mock successful scan service response
      mockScanService.processScanRequest.mockResolvedValue({
        success: true,
        data: {
          scanId: 'scan-123',
          jobId: 'job-456',
          url: 'https://example.com',
          domain: 'example.com',
          status: 'pending',
          createdAt: new Date(),
          estimatedCompletionTime: '1-3 minutes',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify scan service was called with null userId
      expect(mockScanService.processScanRequest).toHaveBeenCalledWith({
        url: 'https://example.com',
        userId: null,
        isPublicScan: undefined,
        userAgent: undefined,
        ipAddress: 'unknown',
      })
    })

    it('handles daily limit exceeded errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUsers.developerUser },
        error: null,
      })

      // Mock daily limit exceeded response
      mockScanService.processScanRequest.mockResolvedValue({
        success: false,
        error: 'Daily scan limit reached. You\'ve used all 50 scans for today. Limit resets at midnight.',
        code: 'DAILY_LIMIT_EXCEEDED',
        details: {
          limit: 50,
          used: 50,
          remaining: 0,
          resetTime: 'midnight'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.code).toBe('DAILY_LIMIT_EXCEEDED')
      expect(data.details.limit).toBe(50)
    })

    it('handles duplicate scan errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUsers.developerUser },
        error: null,
      })

      // Mock duplicate scan response
      mockScanService.processScanRequest.mockResolvedValue({
        success: false,
        error: 'Duplicate scan detected. Please wait 5 minutes before scanning the same URL again.',
        code: 'DUPLICATE_SCAN',
        details: {
          waitTime: '5 minutes',
          lastScanId: 'scan-456'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.code).toBe('DUPLICATE_SCAN')
      expect(data.details.waitTime).toBe('5 minutes')
    })

    it('handles plan limit exceeded errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testUsers.developerUser },
        error: null,
      })

      // Mock plan limit exceeded response
      mockScanService.processScanRequest.mockResolvedValue({
        success: false,
        error: 'Plan limit exceeded',
        code: 'PLAN_LIMIT_EXCEEDED'
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.code).toBe('PLAN_LIMIT_EXCEEDED')
    })

    it('handles invalid URL protocol errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Mock invalid protocol response
      mockScanService.processScanRequest.mockResolvedValue({
        success: false,
        error: 'Only HTTP and HTTPS URLs are supported',
        code: 'INVALID_PROTOCOL'
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'ftp://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_PROTOCOL')
    })

    it('validates request body format', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'not-a-valid-url' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toContain('Please provide a valid URL')
    })

    it('handles internal service errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Mock internal service error
      mockScanService.processScanRequest.mockResolvedValue({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      })

      const request = new NextRequest('http://localhost:3000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('GET /api/scan', () => {
    it('returns health check status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.services).toBeDefined()
      expect(data.services.scan).toBe('operational')
    })
  })
})
