// Test scan fixtures
export const testScans = {
  pending: {
    id: 'scan-1',
    userId: 'test-user-2',
    url: 'https://example.com',
    status: 'pending' as const,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    completedAt: null,
    results: [],
  },
  
  completed: {
    id: 'scan-2', 
    userId: 'test-user-2',
    url: 'https://secure-example.com',
    status: 'completed' as const,
    createdAt: new Date('2025-01-01T09:00:00Z'),
    completedAt: new Date('2025-01-01T09:05:00Z'),
    results: [
      {
        id: 'result-1',
        scanId: 'scan-2',
        testType: 'security_headers',
        severity: 'medium' as const,
        title: 'Missing Content Security Policy',
        description: 'The website does not implement a Content Security Policy header',
        recommendation: 'Add a CSP header to prevent XSS attacks',
        owaspCategory: 'A05',
        evidence: {
          headers: {
            'content-type': 'text/html',
            'server': 'nginx'
          }
        }
      }
    ],
  },
  
  failed: {
    id: 'scan-3',
    userId: 'test-user-2', 
    url: 'https://unreachable-site.com',
    status: 'failed' as const,
    createdAt: new Date('2025-01-01T08:00:00Z'),
    completedAt: new Date('2025-01-01T08:01:00Z'),
    error: 'Connection timeout',
    results: [],
  },
}

export const testScanResults = {
  securityHeaders: {
    id: 'result-1',
    scanId: 'scan-2',
    testType: 'security_headers',
    severity: 'high' as const,
    title: 'Missing Security Headers',
    description: 'Multiple critical security headers are missing',
    recommendation: 'Implement HSTS, CSP, and X-Frame-Options headers',
    owaspCategory: 'A05',
    evidence: {
      missingHeaders: ['strict-transport-security', 'content-security-policy', 'x-frame-options']
    }
  },
  
  cookieSecurity: {
    id: 'result-2',
    scanId: 'scan-2', 
    testType: 'cookie_security',
    severity: 'medium' as const,
    title: 'Insecure Cookie Configuration',
    description: 'Session cookies lack security attributes',
    recommendation: 'Add Secure, HttpOnly, and SameSite attributes to cookies',
    owaspCategory: 'A07',
    evidence: {
      insecureCookies: [
        { name: 'session_id', secure: false, httpOnly: false, sameSite: 'none' }
      ]
    }
  },
  
  directoryExposure: {
    id: 'result-3',
    scanId: 'scan-2',
    testType: 'directory_exposure', 
    severity: 'low' as const,
    title: 'Directory Listing Enabled',
    description: 'Server allows directory browsing on /uploads/',
    recommendation: 'Disable directory listing or add index file',
    owaspCategory: 'A05',
    evidence: {
      exposedPaths: ['/uploads/', '/temp/']
    }
  },
}