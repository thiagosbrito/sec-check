// Mock Stripe for testing
export const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    list: jest.fn(),
  },
  
  prices: {
    list: jest.fn(),
    retrieve: jest.fn(),
  },
  
  products: {
    list: jest.fn(),
    retrieve: jest.fn(),
  },
  
  webhooks: {
    constructEvent: jest.fn(),
  },
  
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
}

// Mock Stripe module
jest.mock('stripe', () => {
  return jest.fn(() => mockStripe)
})

// Test data for Stripe responses
export const mockStripeData = {
  customer: {
    id: 'cus_test123',
    email: 'test@example.com',
    name: 'Test User',
    created: 1672531200, // 2023-01-01
  },
  
  subscription: {
    id: 'sub_test123',
    customer: 'cus_test123',
    status: 'active',
    current_period_start: 1672531200,
    current_period_end: 1675209600,
    items: {
      data: [{
        price: {
          id: 'price_developer_monthly',
          unit_amount: 999,
          currency: 'usd',
        }
      }]
    }
  },
  
  checkoutSession: {
    id: 'cs_test123',
    customer: 'cus_test123',
    payment_status: 'paid',
    mode: 'subscription',
    url: 'https://checkout.stripe.com/c/pay/cs_test123',
  },
  
  webhookEvent: {
    id: 'evt_test123',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
      }
    }
  }
}