// Jest setup file for React Testing Library
import '@testing-library/jest-dom'

// Add Web API polyfills for Jest environment
const { TextEncoder, TextDecoder } = require('util')

// Polyfill Web APIs that are missing in Jest environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill fetch and Response if not available
if (!global.fetch) {
  global.fetch = jest.fn()
}

if (!global.Response) {
  global.Response = class MockResponse {
    ok = true
    status = 200
    statusText = 'OK'
    headers = new Map()
    body: any = null
    bodyUsed = false
    
    constructor(body?: any, init?: any) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.ok = this.status >= 200 && this.status < 300
    }
    
    async json() { 
      return this.body ? JSON.parse(this.body) : null 
    }
    async text() { 
      return this.body || '' 
    }
    async blob() { 
      return new Blob([this.body || '']) 
    }
    async arrayBuffer() { 
      return new ArrayBuffer(0) 
    }
    clone() { 
      return new (this.constructor as any)(this.body, { 
        status: this.status, 
        statusText: this.statusText 
      }) 
    }
  } as any
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

// Create a mock NextResponse class
class MockNextResponse extends Response {
  cookies = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => []),
    has: jest.fn(() => false),
  }

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init)
  }

  static json(object: any, init?: ResponseInit) {
    return new MockNextResponse(JSON.stringify(object), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    })
  }

  static redirect(url: string | URL, status?: number): MockNextResponse {
    return new MockNextResponse(null, {
      status: status || 307,
      headers: {
        Location: url.toString(),
      },
    })
  }
}

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: MockNextResponse,
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => Promise.resolve(new Map([
    ['content-type', 'application/json'],
    ['user-agent', 'test-agent'],
  ]))),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
}

// Mock all external services with comprehensive defaults
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: null }, 
        error: null 
      })),
    },
  })),
}))

jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([])),
        onConflictDoUpdate: jest.fn(() => Promise.resolve())
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve())
      }))
    })),
  },
}))

jest.mock('@/lib/db/schema', () => ({
  users: { id: 'users.id', scanLimit: 'users.scanLimit', plan: 'users.plan' },
  scans: { id: 'scans.id', userId: 'scans.userId', url: 'scans.url', createdAt: 'scans.createdAt' },
  subscriptions: { stripeCustomerId: 'subscriptions.stripeCustomerId' },
  billingHistory: { stripeInvoiceId: 'billingHistory.stripeInvoiceId' },
  usageStats: { userId: 'usageStats.userId', date: 'usageStats.date' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => 'eq_condition'),
  and: jest.fn(() => 'and_condition'),
  gte: jest.fn(() => 'gte_condition'),
  lt: jest.fn(() => 'lt_condition'),
  sql: jest.fn((template) => ({ count: 0 })),
}))

jest.mock('@/lib/queue/queue', () => ({
  addScanJob: jest.fn(() => Promise.resolve({ id: 'job-123' })),
}))

jest.mock('@/lib/billing/enforcement', () => ({
  planEnforcementService: {
    checkScanLimit: jest.fn(() => Promise.resolve({ allowed: true })),
    trackScanUsage: jest.fn(() => Promise.resolve()),
  },
}))

jest.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
  getPlanPrice: jest.fn(() => 999),
}))

// Node.js polyfills for Jest environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder
global.TextDecoder = global.TextDecoder || require('util').TextDecoder
global.crypto = global.crypto || require('crypto')

// Global test utilities
global.fetch = jest.fn()

// Enhanced polyfills for Next.js Web API components with Edge Runtime compatibility
global.Request = global.Request || class Request {
  url: string
  method: string
  headers: any
  body: any

  constructor(url: string, options: any = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this.body = options.body
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }

  text() {
    return Promise.resolve(this.body || '')
  }

  get(name: string) {
    return this.headers.get(name)
  }
}

global.Response = global.Response || class Response {
  status: number
  ok: boolean
  body: any
  headers: any

  constructor(body: any, options: any = {}) {
    this.body = body
    this.status = options.status || 200
    this.ok = this.status >= 200 && this.status < 300
    this.headers = new Map(Object.entries(options.headers || {}))
  }

  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }

  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body))
  }

  static json(data: any, options: any = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    })
  }
}

global.Headers = global.Headers || class Headers extends Map {
  constructor(init?: any) {
    super()
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value))
      } else {
        Object.entries(init).forEach(([key, value]) => this.set(key, value as string))
      }
    }
  }

  get(name: string) {
    return super.get(name.toLowerCase())
  }

  set(name: string, value: string) {
    return super.set(name.toLowerCase(), value)
  }
}

// Suppress console.log in tests unless explicitly needed
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError  
  console.warn = originalConsoleWarn
  jest.clearAllMocks()
})