/**
 * E2E API tests for the scan endpoint
 * Tests the actual HTTP API with real requests
 */
import { test, expect } from '@playwright/test'

test.describe('Scan API E2E', () => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('handles public scan requests successfully', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/scan`, {
      data: {
        url: 'https://example.com',
        isPublicScan: true
      }
    })

    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.scanId).toBeDefined()
    expect(data.data.url).toBe('https://example.com')
    expect(data.data.domain).toBe('example.com')
    expect(data.data.status).toBe('pending')
    expect(data.data.estimatedCompletionTime).toBe('1-3 minutes')
  })

  test('validates URL format', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/scan`, {
      data: {
        url: 'not-a-valid-url'
      }
    })

    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid request data')
    expect(data.details).toContain('Please provide a valid URL')
  })

  test('rejects non-HTTP/HTTPS protocols', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/scan`, {
      data: {
        url: 'ftp://example.com'
      }
    })

    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Only HTTP and HTTPS URLs are supported')
    expect(data.code).toBe('INVALID_PROTOCOL')
  })

  test('handles malformed JSON requests', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/scan`, {
      data: 'invalid-json',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Should return 400 for malformed JSON (not 500)
    expect(response.status()).toBe(400)
  })

  test('health check endpoint works', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/scan`)

    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.services).toBeDefined()
    expect(data.services.scan).toBe('operational')
    expect(data.services.queue).toBe('operational')
    expect(data.services.database).toBe('operational')
  })

  test('handles empty request body', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/scan`, {
      data: {}
    })

    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid request data')
  })

  test('processes multiple valid URLs sequentially', async ({ request }) => {
    const urls = [
      'https://example.com',
      'https://google.com',
      'https://github.com'
    ]

    for (const url of urls) {
      const response = await request.post(`${baseURL}/api/scan`, {
        data: { url, isPublicScan: true }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.url).toBe(url)
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  })

  test('respects content-type headers', async ({ request }) => {
    // Test with correct content-type
    const validResponse = await request.post(`${baseURL}/api/scan`, {
      data: { url: 'https://example.com' },
      headers: { 'Content-Type': 'application/json' }
    })
    expect(validResponse.status()).toBe(200)

    // Test with missing content-type (should still work)
    const missingCtResponse = await request.post(`${baseURL}/api/scan`, {
      data: { url: 'https://example.com' }
    })
    expect(missingCtResponse.status()).toBe(200)
  })
})
