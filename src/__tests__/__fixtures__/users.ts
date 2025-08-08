// Test user fixtures
export const testUsers = {
  freeUser: {
    id: 'test-user-1',
    email: 'free@example.com',
    name: 'Free User',
    plan: 'free' as const,
    scansRemaining: 3,
    scansTotal: 3,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  },
  
  developerUser: {
    id: 'test-user-2', 
    email: 'developer@example.com',
    name: 'Developer User',
    plan: 'developer' as const,
    scansRemaining: 100,
    scansTotal: 100,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  },
  
  teamUser: {
    id: 'test-user-3',
    email: 'team@example.com', 
    name: 'Team User',
    plan: 'team' as const,
    scansRemaining: 1000,
    scansTotal: 1000,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  },
  
  expiredUser: {
    id: 'test-user-4',
    email: 'expired@example.com',
    name: 'Expired User',
    plan: 'free' as const,
    scansRemaining: 0,
    scansTotal: 3,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  },
}

export const testSession = {
  valid: {
    user: testUsers.developerUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  },
  
  expired: {
    user: testUsers.freeUser,
    expires: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
}