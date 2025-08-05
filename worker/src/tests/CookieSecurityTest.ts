import axios from 'axios';
import type { SecurityTestResult } from '../types';

export class CookieSecurityTest {
  static async run(url: string): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
        maxRedirects: 5,
      });

      const setCookieHeader = response.headers['set-cookie'];
      
      if (!setCookieHeader || setCookieHeader.length === 0) {
        results.push({
          testName: 'cookie_security',
          owaspCategory: 'A07',
          severity: 'info',
          status: 'pass',
          title: 'No Cookies Set',
          description: 'No cookies are being set by the server',
          confidence: 95,
        });
        return results;
      }

      // Analyze each cookie
      setCookieHeader.forEach((cookieString, index) => {
        const cookieAnalysis = this.analyzeCookie(cookieString, index);
        results.push(...cookieAnalysis);
      });

    } catch (error) {
      results.push({
        testName: 'cookie_security',
        owaspCategory: 'A07',
        severity: 'info',
        status: 'error',
        title: 'Cookie Security Test Failed',
        description: 'Unable to analyze cookies due to network error',
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0,
      });
    }

    return results;
  }

  private static analyzeCookie(cookieString: string, index: number): SecurityTestResult[] {
    const results: SecurityTestResult[] = [];
    const cookieName = cookieString.split('=')[0].trim();
    
    // Parse cookie attributes
    const attributes = {
      secure: /;\s*secure\s*(;|$)/i.test(cookieString),
      httpOnly: /;\s*httponly\s*(;|$)/i.test(cookieString),
      sameSite: /;\s*samesite\s*=\s*([^;]+)/i.exec(cookieString)?.[1]?.trim().toLowerCase(),
      domain: /;\s*domain\s*=\s*([^;]+)/i.exec(cookieString)?.[1]?.trim(),
      path: /;\s*path\s*=\s*([^;]+)/i.exec(cookieString)?.[1]?.trim(),
      expires: /;\s*expires\s*=\s*([^;]+)/i.exec(cookieString)?.[1]?.trim(),
      maxAge: /;\s*max-age\s*=\s*([^;]+)/i.exec(cookieString)?.[1]?.trim(),
    };

    // Check for Secure flag
    if (!attributes.secure) {
      results.push({
        testName: 'cookie_secure_flag',
        owaspCategory: 'A07',
        severity: 'medium',
        status: 'fail',
        title: `Cookie Missing Secure Flag: ${cookieName}`,
        description: 'Cookie can be transmitted over unencrypted HTTP connections',
        impact: 'Cookie values may be intercepted by attackers on insecure networks',
        recommendation: 'Add the Secure flag to all cookies containing sensitive data',
        evidence: { 
          cookie_name: cookieName,
          cookie_string: cookieString,
          attributes: attributes
        },
        references: [
          'https://owasp.org/www-community/controls/SecureCookieAttribute'
        ],
        confidence: 95,
      });
    }

    // Check for HttpOnly flag
    if (!attributes.httpOnly) {
      results.push({
        testName: 'cookie_httponly_flag',
        owaspCategory: 'A07',
        severity: 'medium',
        status: 'fail',
        title: `Cookie Missing HttpOnly Flag: ${cookieName}`,
        description: 'Cookie can be accessed via client-side JavaScript',
        impact: 'Vulnerable to XSS attacks that steal session cookies',
        recommendation: 'Add the HttpOnly flag to prevent JavaScript access',
        evidence: { 
          cookie_name: cookieName,
          cookie_string: cookieString,
          attributes: attributes
        },
        references: [
          'https://owasp.org/www-community/HttpOnly'
        ],
        confidence: 95,
      });
    }

    // Check for SameSite attribute
    if (!attributes.sameSite) {
      results.push({
        testName: 'cookie_samesite_flag',
        owaspCategory: 'A07',
        severity: 'medium',
        status: 'fail',
        title: `Cookie Missing SameSite Attribute: ${cookieName}`,
        description: 'Cookie does not have SameSite protection against CSRF attacks',
        impact: 'Vulnerable to Cross-Site Request Forgery (CSRF) attacks',
        recommendation: 'Add SameSite=Strict or SameSite=Lax attribute',
        evidence: { 
          cookie_name: cookieName,
          cookie_string: cookieString,
          attributes: attributes
        },
        references: [
          'https://owasp.org/www-community/SameSite'
        ],
        confidence: 90,
      });
    } else if (attributes.sameSite === 'none') {
      results.push({
        testName: 'cookie_samesite_flag',
        owaspCategory: 'A07',
        severity: 'low',
        status: 'warning',
        title: `Cookie SameSite=None: ${cookieName}`,
        description: 'Cookie uses SameSite=None, which offers no CSRF protection',
        impact: 'May be vulnerable to CSRF attacks in certain contexts',
        recommendation: 'Consider using SameSite=Strict or SameSite=Lax if cross-site access is not required',
        evidence: { 
          cookie_name: cookieName,
          cookie_string: cookieString,
          attributes: attributes
        },
        confidence: 85,
      });
    }

    // Check for overly broad domain
    if (attributes.domain && attributes.domain.startsWith('.')) {
      results.push({
        testName: 'cookie_domain_scope',
        owaspCategory: 'A07',
        severity: 'low',
        status: 'warning',
        title: `Cookie Broad Domain Scope: ${cookieName}`,
        description: 'Cookie domain scope may be too broad',
        impact: 'Cookie may be accessible to more subdomains than necessary',
        recommendation: 'Restrict cookie domain to specific subdomain if possible',
        evidence: { 
          cookie_name: cookieName,
          domain: attributes.domain,
          cookie_string: cookieString
        },
        confidence: 75,
      });
    }

    // If all security attributes are present, add a positive result
    if (attributes.secure && attributes.httpOnly && attributes.sameSite && attributes.sameSite !== 'none') {
      results.push({
        testName: 'cookie_security',
        owaspCategory: 'A07',
        severity: 'info',
        status: 'pass',
        title: `Cookie Security: ${cookieName}`,
        description: 'Cookie has proper security attributes configured',
        evidence: { 
          cookie_name: cookieName,
          attributes: attributes
        },
        confidence: 95,
      });
    }

    return results;
  }
}