// Mock Supabase client for testing
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(), 
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
  
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(), 
      remove: jest.fn(),
      list: jest.fn(),
    })),
  },
  
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}

// Mock the Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock server-side Supabase (only if the module exists)
// jest.mock('@/lib/supabase/server', () => ({
//   createClient: jest.fn(() => mockSupabaseClient),
// }))

// Mock client-side Supabase (only if the module exists)
// jest.mock('@/lib/supabase/client', () => ({
//   supabase: mockSupabaseClient,
// }))