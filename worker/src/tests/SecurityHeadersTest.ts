import axios from 'axios';
import type { SecurityTestResult } from '../types';

export class SecurityHeadersTest {
  static async run(url: string): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true, // Accept all status codes
        maxRedirects: 5,
      });

      const headers = response.headers;

      // Test for Content Security Policy
      results.push(this.testCSP(headers));
      
      // Test for HTTP Strict Transport Security
      results.push(this.testHSTS(headers));
      
      // Test for X-Frame-Options
      results.push(this.testXFrameOptions(headers));
      
      // Test for X-Content-Type-Options
      results.push(this.testXContentTypeOptions(headers));
      
      // Test for Referrer-Policy
      results.push(this.testReferrerPolicy(headers));
      
      // Test for Permissions-Policy
      results.push(this.testPermissionsPolicy(headers));

    } catch (error) {
      results.push({
        testName: 'security_headers',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'error',
        title: 'Security Headers Test Failed',
        description: 'Unable to retrieve security headers due to network error',
        recommendation: 'Ensure the target URL is accessible and try again',
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0,
      });
    }

    return results;
  }

  private static testCSP(headers: Record<string, any>): SecurityTestResult {
    const csp = headers['content-security-policy'] || headers['content-security-policy-report-only'];
    
    if (!csp) {
      return {
        testName: 'content_security_policy',
        owaspCategory: 'A05',
        severity: 'medium',
        status: 'fail',
        title: 'Missing Content Security Policy',
        description: 'The Content-Security-Policy header is not present, which allows unrestricted resource loading',
        impact: 'Increases risk of XSS attacks and data injection',
        recommendation: 'Implement a Content-Security-Policy header to restrict resource origins',
        references: [
          'https://owasp.org/www-project-secure-headers/#content-security-policy',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
        ],
        evidence: { headers_checked: Object.keys(headers) },
        confidence: 95,
      };
    }

    // Check for unsafe directives
    const unsafeDirectives = [
      "'unsafe-inline'",
      "'unsafe-eval'",
      "data:",
      "*"
    ];

    const hasUnsafeDirectives = unsafeDirectives.some(directive => 
      csp.toLowerCase().includes(directive.toLowerCase())
    );

    if (hasUnsafeDirectives) {
      return {
        testName: 'content_security_policy',
        owaspCategory: 'A05',
        severity: 'medium',
        status: 'warning',
        title: 'Content Security Policy Contains Unsafe Directives',
        description: 'CSP is present but contains potentially unsafe directives',
        impact: 'Reduced protection against XSS and injection attacks',
        recommendation: 'Review and tighten CSP directives, avoid unsafe-inline and unsafe-eval',
        evidence: { csp_header: csp },
        confidence: 85,
      };
    }

    return {
      testName: 'content_security_policy',
      owaspCategory: 'A05',
      severity: 'info',
      status: 'pass',
      title: 'Content Security Policy Implemented',
      description: 'A Content-Security-Policy header is present and appears to be properly configured',
      evidence: { csp_header: csp },
      confidence: 90,
    };
  }

  private static testHSTS(headers: Record<string, any>): SecurityTestResult {
    const hsts = headers['strict-transport-security'];
    
    if (!hsts) {
      return {
        testName: 'hsts',
        owaspCategory: 'A02',
        severity: 'medium',
        status: 'fail',
        title: 'Missing HTTP Strict Transport Security',
        description: 'The Strict-Transport-Security header is not present',
        impact: 'Vulnerable to protocol downgrade attacks and cookie hijacking',
        recommendation: 'Implement HSTS header with appropriate max-age value',
        references: [
          'https://owasp.org/www-project-secure-headers/#http-strict-transport-security',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'
        ],
        confidence: 95,
      };
    }

    // Check max-age value
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;
    
    if (maxAge < 31536000) { // Less than 1 year
      return {
        testName: 'hsts',
        owaspCategory: 'A02',
        severity: 'low',
        status: 'warning',
        title: 'HSTS Max-Age Too Short',
        description: 'HSTS is present but max-age value is less than recommended (1 year)',
        recommendation: 'Increase max-age to at least 31536000 seconds (1 year)',
        evidence: { hsts_header: hsts, max_age: maxAge },
        confidence: 90,
      };
    }

    return {
      testName: 'hsts',
      owaspCategory: 'A02',
      severity: 'info',
      status: 'pass',
      title: 'HTTP Strict Transport Security Implemented',
      description: 'HSTS header is properly configured with adequate max-age',
      evidence: { hsts_header: hsts, max_age: maxAge },
      confidence: 95,
    };
  }

  private static testXFrameOptions(headers: Record<string, any>): SecurityTestResult {
    const xFrameOptions = headers['x-frame-options'];
    
    if (!xFrameOptions) {
      return {
        testName: 'x_frame_options',
        owaspCategory: 'A05',
        severity: 'medium',
        status: 'fail',
        title: 'Missing X-Frame-Options Header',
        description: 'The X-Frame-Options header is not present',
        impact: 'Vulnerable to clickjacking attacks',
        recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN',
        references: [
          'https://owasp.org/www-project-secure-headers/#x-frame-options',
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'
        ],
        confidence: 95,
      };
    }

    const validValues = ['DENY', 'SAMEORIGIN'];
    const isValid = validValues.some(value => 
      xFrameOptions.toUpperCase().includes(value)
    );

    if (!isValid) {
      return {
        testName: 'x_frame_options',
        owaspCategory: 'A05',
        severity: 'low',
        status: 'warning',
        title: 'X-Frame-Options Invalid Value',
        description: 'X-Frame-Options header has an invalid or weak value',
        recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN',
        evidence: { x_frame_options: xFrameOptions },
        confidence: 90,
      };
    }

    return {
      testName: 'x_frame_options',
      owaspCategory: 'A05',
      severity: 'info',
      status: 'pass',
      title: 'X-Frame-Options Properly Configured',
      description: 'X-Frame-Options header provides clickjacking protection',
      evidence: { x_frame_options: xFrameOptions },
      confidence: 95,
    };
  }

  private static testXContentTypeOptions(headers: Record<string, any>): SecurityTestResult {
    const xContentTypeOptions = headers['x-content-type-options'];
    
    if (!xContentTypeOptions || !xContentTypeOptions.toLowerCase().includes('nosniff')) {
      return {
        testName: 'x_content_type_options',
        owaspCategory: 'A05',
        severity: 'low',
        status: 'fail',
        title: 'Missing X-Content-Type-Options Header',
        description: 'The X-Content-Type-Options header is not set to nosniff',
        impact: 'Vulnerable to MIME type confusion attacks',
        recommendation: 'Set X-Content-Type-Options to nosniff',
        references: [
          'https://owasp.org/www-project-secure-headers/#x-content-type-options'
        ],
        confidence: 90,
      };
    }

    return {
      testName: 'x_content_type_options',
      owaspCategory: 'A05',
      severity: 'info',
      status: 'pass',
      title: 'X-Content-Type-Options Configured',
      description: 'X-Content-Type-Options is set to nosniff',
      evidence: { x_content_type_options: xContentTypeOptions },
      confidence: 95,
    };
  }

  private static testReferrerPolicy(headers: Record<string, any>): SecurityTestResult {
    const referrerPolicy = headers['referrer-policy'];
    
    if (!referrerPolicy) {
      return {
        testName: 'referrer_policy',
        owaspCategory: 'A05',
        severity: 'low',
        status: 'warning',
        title: 'Missing Referrer-Policy Header',
        description: 'The Referrer-Policy header is not present',
        impact: 'May leak sensitive information in referrer headers',
        recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin or stricter',
        confidence: 85,
      };
    }

    const strictPolicies = [
      'no-referrer',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin'
    ];

    const isStrict = strictPolicies.some(policy => 
      referrerPolicy.toLowerCase().includes(policy)
    );

    if (!isStrict) {
      return {
        testName: 'referrer_policy',
        owaspCategory: 'A05',
        severity: 'low',
        status: 'warning',
        title: 'Weak Referrer Policy',
        description: 'Referrer-Policy is present but may be too permissive',
        recommendation: 'Consider using a stricter referrer policy',
        evidence: { referrer_policy: referrerPolicy },
        confidence: 80,
      };
    }

    return {
      testName: 'referrer_policy',
      owaspCategory: 'A05',
      severity: 'info',
      status: 'pass',
      title: 'Referrer-Policy Configured',
      description: 'Referrer-Policy is set with appropriate restrictions',
      evidence: { referrer_policy: referrerPolicy },
      confidence: 90,
    };
  }

  private static testPermissionsPolicy(headers: Record<string, any>): SecurityTestResult {
    const permissionsPolicy = headers['permissions-policy'] || headers['feature-policy'];
    
    if (!permissionsPolicy) {
      return {
        testName: 'permissions_policy',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'warning',
        title: 'Missing Permissions Policy',
        description: 'No Permissions-Policy or Feature-Policy header found',
        impact: 'Browser features are not restricted, potentially increasing attack surface',
        recommendation: 'Consider implementing Permissions-Policy to restrict browser features',
        confidence: 70,
      };
    }

    return {
      testName: 'permissions_policy',
      owaspCategory: 'A05',
      severity: 'info',
      status: 'pass',
      title: 'Permissions Policy Configured',
      description: 'Permissions policy is present to restrict browser features',
      evidence: { permissions_policy: permissionsPolicy },
      confidence: 85,
    };
  }
}