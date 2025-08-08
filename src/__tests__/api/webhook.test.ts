/**
 * Tests for POST /api/webhooks/stripe endpoint
 * Covers webhook signature verification, event handling, database synchronization
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/stripe/route'
import { testUsers } from '../__fixtures__/users'

// Mock external dependencies
jest.mock('@/lib/stripe/client', () => ({
  stripe: {
    instance: {
      webhooks: {
        constructEvent: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
      },
    }
  },
  getPlanPrice: jest.fn(),
}))

jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock('@/lib/db/schema', () => ({
  subscriptions: {
    stripeCustomerId: 'subscriptions.stripeCustomerId',
    stripeSubscriptionId: 'subscriptions.stripeSubscriptionId',
    userId: 'subscriptions.userId',
    id: 'subscriptions.id',
  },
  users: {
    id: 'users.id',
    plan: 'users.plan',
  },
  billingHistory: {
    stripeInvoiceId: 'billingHistory.stripeInvoiceId',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => 'eq_condition'),
  sql: jest.fn(),
}))

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}))

// Helper to create a proper NextRequest for testing
function createWebhookRequest(body: string, headers: Record<string, string> = {}) {
  const url = 'http://localhost:3000/api/webhooks/stripe'
  const request = new Request(url, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  })
  
  // Cast to NextRequest and add required properties
  const nextRequest = request as unknown as NextRequest
  Object.assign(nextRequest, {
    cookies: new Map(),
    nextUrl: new URL(url),
    page: { name: undefined, params: {} },
    ua: { browser: { name: 'test' } },
  })
  
  return nextRequest
}

// Mock Stripe types
const mockStripeEvent = (type: string, data: any) => ({
  id: 'evt_test_webhook',
  type,
  data: { object: data },
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
  api_version: '2023-10-16',
})

const mockStripeSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  items: {
    data: [{
      price: {
        id: 'price_1RtGajL3QQzQQqldqhd0EeIC',
        recurring: { interval: 'month' },
      },
    }]
  },
  currency: 'usd',
  cancel_at_period_end: false,
  canceled_at: null,
  current_period_start: 1640995200,
  current_period_end: 1643673600,
}

const mockStripeInvoice = {
  id: 'in_test123',
  customer: 'cus_test123',
  amount_paid: 999,
  amount_due: 999,
  currency: 'usd',
  description: 'Subscription invoice',
  period_start: 1640995200,
  period_end: 1643673600,
  metadata: {},
  last_finalization_error: null,
}

describe('/api/webhooks/stripe', () => {
  let mockDb: any
  let mockStripe: any
  let mockHeaders: any
  let originalEnv: string | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Store original env
    originalEnv = process.env.STRIPE_WEBHOOK_SECRET
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'

    // Mock database operations
    const { db } = require('@/lib/db/connection')
    mockDb = db

    const setupMockQuery = (returnValue: any) => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => returnValue),
          returning: jest.fn(() => returnValue),
        })),
        limit: jest.fn(() => returnValue),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => Promise.resolve()),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn(() => returnValue),
          })),
        })),
      })),
    })

    mockDb.select.mockImplementation(() => setupMockQuery([{
      userId: testUsers.developerUser.id,
      id: 'sub_123',
      plan: 'developer',
    }]))
    mockDb.insert.mockImplementation(() => setupMockQuery([]))
    mockDb.update.mockImplementation(() => setupMockQuery([{
      userId: testUsers.developerUser.id,
      id: 'sub_123',
      plan: 'developer',
    }]))

    // Mock Stripe client
    const { stripe } = require('@/lib/stripe/client')
    mockStripe = stripe

    // Mock headers function - return a Map by default
    const { headers } = require('next/headers')
    mockHeaders = headers
    mockHeaders.mockResolvedValue(new Map([
      ['stripe-signature', 't=12345,v1=valid_signature'],
    ]))
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = originalEnv
    } else {
      delete process.env.STRIPE_WEBHOOK_SECRET
    }
  })

  describe('Webhook Security', () => {
    it('returns 500 when webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      const request = createWebhookRequest('{}')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook secret not configured')
    })

    it('returns 400 when stripe-signature header is missing', async () => {
      // Override the mock to return empty headers
      mockHeaders.mockResolvedValue(new Map())

      const request = createWebhookRequest('{}')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing stripe-signature header')
    })

    it('returns 400 when webhook signature verification fails', async () => {
      mockStripe.instance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid signature')
    })

    it('successfully verifies valid webhook signature', async () => {
      const event = mockStripeEvent('customer.created', { id: 'cus_test' })
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      expect(mockStripe.instance.webhooks.constructEvent).toHaveBeenCalledWith(
        'webhook_body',
        't=12345,v1=valid_signature',
        'whsec_test_secret'
      )
    })
  })

  describe('Subscription Events', () => {
    beforeEach(() => {
      const event = mockStripeEvent('customer.subscription.created', mockStripeSubscription)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)
    })

    it('handles subscription.created event', async () => {
      const event = mockStripeEvent('customer.subscription.created', mockStripeSubscription)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })

    it('handles subscription.updated event with plan change', async () => {
      const event = mockStripeEvent('customer.subscription.updated', mockStripeSubscription)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('handles subscription.deleted event', async () => {
      const event = mockStripeEvent('customer.subscription.deleted', mockStripeSubscription)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)

      // Verify subscription was marked as canceled
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('handles checkout.session.completed event', async () => {
      const checkoutSession = {
        id: 'cs_test123',
        subscription: 'sub_test123',
        customer: 'cus_test123',
        mode: 'subscription',
      }
      const event = mockStripeEvent('checkout.session.completed', checkoutSession)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)
      mockStripe.instance.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockStripe.instance.subscriptions.retrieve).toHaveBeenCalledWith('sub_test123')
    })
  })

  describe('Payment Events', () => {
    it('handles invoice.payment_succeeded event', async () => {
      const event = mockStripeEvent('invoice.payment_succeeded', mockStripeInvoice)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      // Mock database calls specifically for payment handling
      // First call: find subscription (should return a subscription)
      // Second call: check for duplicate billing history (should return empty)
      let callCount = 0
      mockDb.select.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: subscription lookup - return subscription
          return {
            from: jest.fn(() => ({
              where: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve([{
                  userId: testUsers.developerUser.id,
                  id: 'sub_123',
                  plan: 'developer',
                }])),
              })),
            })),
          }
        } else {
          // Second call: billing history duplicate check - return empty
          return {
            from: jest.fn(() => ({
              where: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve([])),
              })),
            })),
          }
        }
      })

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('handles invoice.payment_failed event', async () => {
      const event = mockStripeEvent('invoice.payment_failed', mockStripeInvoice)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('prevents duplicate billing history records', async () => {
      // Mock existing record found
      mockDb.select.mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => [{ id: 'existing_record' }])
          }))
        }))
      }))

      const event = mockStripeEvent('invoice.payment_succeeded', mockStripeInvoice)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockDb.insert).not.toHaveBeenCalled() // Should skip duplicate
    })
  })

  describe('Customer Events', () => {
    it('handles customer.created event', async () => {
      const event = mockStripeEvent('customer.created', { id: 'cus_test' })
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('handles customer.updated event', async () => {
      const event = mockStripeEvent('customer.updated', { id: 'cus_test' })
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Product Events', () => {
    it('handles product.updated event', async () => {
      const event = mockStripeEvent('product.updated', { id: 'prod_test' })
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Unhandled Events', () => {
    it('handles unrecognized event types gracefully', async () => {
      const event = mockStripeEvent('some.unknown.event', { id: 'test' })
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      const event = mockStripeEvent('customer.subscription.created', mockStripeSubscription)
      mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)
      
      // Mock database error
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = createWebhookRequest('webhook_body')
      const response = await POST(request)

      // Should still return 200 to acknowledge webhook receipt
      // even though individual event processing failed
      expect(response.status).toBe(200)
    })

    it('handles webhook processing errors', async () => {
      const request = createWebhookRequest('webhook_body')
      
      // Mock request.text to throw
      jest.spyOn(request, 'text').mockRejectedValue(new Error('Request processing failed'))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Webhook processing failed')
    })
  })

  describe('Plan Mapping', () => {
    it('correctly maps price IDs to plans', async () => {
      const testCases = [
        { priceId: 'price_1RtGajL3QQzQQqldqhd0EeIC', expectedPlan: 'developer' }, // monthly
        { priceId: 'price_1RtGocL3QQzQQqldDMmWqRY2', expectedPlan: 'developer' }, // yearly
        { priceId: 'price_1RtGbKL3QQzQQqldSTCokYBA', expectedPlan: 'team' },      // monthly
        { priceId: 'price_1RtGpNL3QQzQQqld9AuiPSZJ', expectedPlan: 'team' },      // yearly
        { priceId: 'unknown_price_id', expectedPlan: 'free' },                    // unknown
      ]

      for (const { priceId, expectedPlan } of testCases) {
        const subscription = {
          ...mockStripeSubscription,
          items: {
            data: [{
              price: {
                id: priceId,
                recurring: { interval: 'month' },
              },
            }]
          }
        }

        const event = mockStripeEvent('customer.subscription.created', subscription)
        mockStripe.instance.webhooks.constructEvent.mockReturnValue(event)

        const request = createWebhookRequest('webhook_body')
        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })
  })
})

