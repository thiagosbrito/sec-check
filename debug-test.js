// Quick debug test to check mock behavior
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}))

const test = async () => {
  const { headers } = require('next/headers')
  headers.mockResolvedValue(new Map([
    ['stripe-signature', 't=12345,v1=valid_signature'],
  ]))
  
  const result = await headers()
  console.log('Mock result:', result)
  console.log('Map get result:', result.get('stripe-signature'))
}

test()
