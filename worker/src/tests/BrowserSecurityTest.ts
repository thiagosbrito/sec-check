import { chromium, Browser, Page } from 'playwright';
import type { SecurityTestResult } from '../types';

export class BrowserSecurityTest {
  static async run(url: string): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Determine if we should run headless or visible
      const isLiveViewEnabled = process.env.ENABLE_LIVE_VIEW === 'true';
      const display = process.env.DISPLAY || ':99';

      console.log(`🎬 Starting browser test - Live view: ${isLiveViewEnabled ? 'ENABLED' : 'DISABLED'}`);

      // Try to find the correct Chromium executable
      let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      
      if (!executablePath) {
        // Try to find browsers dynamically
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const { glob } = await import('glob');
        
        const homeDir = os.homedir();
        console.log(`🏠 Home directory: ${homeDir}`);
        
        // Try to find any chromium installation using glob patterns
        const searchPatterns = [
          '/root/.cache/ms-playwright/chromium-*/chrome-linux/chrome',
          '/root/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell',
          path.join(homeDir, '.cache/ms-playwright/chromium-*/chrome-linux/chrome'),
          path.join(homeDir, '.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell'),
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome',
        ];
        
        for (const pattern of searchPatterns) {
          try {
            const matches = await glob(pattern);
            if (matches && matches.length > 0) {
              const testPath = matches[0];
              if (fs.existsSync(testPath)) {
                executablePath = testPath;
                console.log(`🎯 Found Chromium at: ${executablePath}`);
                break;
              }
            }
          } catch (e) {
            console.warn(`Failed to search pattern ${pattern}:`, e);
          }
        }
        
        // If still not found, list what's actually in the cache directories
        if (!executablePath) {
          try {
            // Check root cache first (where browsers are installed)
            const rootCacheDir = '/root/.cache/ms-playwright';
            console.log(`📂 Checking root cache directory: ${rootCacheDir}`);
            if (fs.existsSync(rootCacheDir)) {
              const contents = fs.readdirSync(rootCacheDir);
              console.log(`📁 Root cache directory contents:`, contents);
            } else {
              console.log(`❌ Root cache directory doesn't exist: ${rootCacheDir}`);
            }
            
            // Also check user cache
            const userCacheDir = path.join(homeDir, '.cache/ms-playwright');
            console.log(`📂 Checking user cache directory: ${userCacheDir}`);
            if (fs.existsSync(userCacheDir)) {
              const contents = fs.readdirSync(userCacheDir);
              console.log(`📁 User cache directory contents:`, contents);
            } else {
              console.log(`❌ User cache directory doesn't exist: ${userCacheDir}`);
            }
          } catch (e) {
            console.warn('Failed to list cache directories:', e);
          }
        }
      }

      console.log(`🚀 Launching browser with executable: ${executablePath || 'default'}`);

      // Launch browser with live viewing capability
      browser = await chromium.launch({
        headless: !isLiveViewEnabled, // Show browser if live view is enabled
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-extensions',
          '--disable-plugins',
          ...(isLiveViewEnabled ? [`--display=${display}`] : [])
        ],
        executablePath: executablePath || undefined,
        slowMo: isLiveViewEnabled ? 1000 : 0, // Slow down actions for viewing
      });

      page = await browser.newPage();

      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'SecCheck/1.0 Security Scanner'
      });

      // Navigate to URL with timeout
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Test 1: XSS Detection via DOM manipulation
      const xssResult = await this.testXSSVulnerability(page, url);
      results.push(xssResult);

      // Test 2: Content Security Policy via JavaScript
      const cspResult = await this.testCSPBypass(page, url);
      results.push(cspResult);

      // Test 3: Mixed content detection
      const mixedContentResult = await this.testMixedContent(page, url);
      results.push(mixedContentResult);

      // Test 4: JavaScript errors and sensitive data exposure
      const jsErrorsResult = await this.testJavaScriptErrors(page, url);
      results.push(jsErrorsResult);

    } catch (error) {
      results.push({
        testName: 'browser_security_scan',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'error',
        title: 'Browser Security Test Failed',
        description: 'Unable to complete browser-based security tests',
        evidence: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          url 
        },
        confidence: 0,
      });
    } finally {
      // Cleanup
      if (page) await page.close();
      if (browser) await browser.close();
    }

    return results;
  }

  private static async testXSSVulnerability(page: Page, url: string): Promise<SecurityTestResult> {
    try {
      // Test for reflected XSS by checking if URL parameters are reflected in DOM
      const urlObj = new URL(url);
      const hasParams = urlObj.searchParams.size > 0;

      if (!hasParams) {
        return {
          testName: 'xss_reflection_test',
          owaspCategory: 'A03',
          severity: 'info',
          status: 'pass',
          title: 'XSS Reflection Test',
          description: 'No URL parameters found to test for reflected XSS',
          confidence: 50,
        };
      }

      // Check if any URL parameters are reflected in the page content
      const pageContent = await page.content();
      const reflectedParams: string[] = [];

      for (const [key, value] of urlObj.searchParams) {
        if (pageContent.includes(value) && value.length > 3) {
          reflectedParams.push(`${key}=${value}`);
        }
      }

      if (reflectedParams.length > 0) {
        return {
          testName: 'xss_reflection_test',
          owaspCategory: 'A03',
          severity: 'medium',
          status: 'warning',
          title: 'Potential XSS Reflection Detected',
          description: 'URL parameters are reflected in page content without apparent encoding',
          evidence: { 
            reflected_parameters: reflectedParams,
            url 
          },
          recommendation: 'Implement proper input validation and output encoding for all user inputs',
          confidence: 70,
        };
      }

      return {
        testName: 'xss_reflection_test',
        owaspCategory: 'A03',
        severity: 'info',
        status: 'pass',
        title: 'XSS Reflection Test Passed',
        description: 'No obvious parameter reflection detected',
        confidence: 60,
      };

    } catch (error) {
      return {
        testName: 'xss_reflection_test',
        owaspCategory: 'A03',
        severity: 'info',
        status: 'error',
        title: 'XSS Test Error',
        description: 'Unable to complete XSS reflection test',
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0,
      };
    }
  }

  private static async testCSPBypass(page: Page, url: string): Promise<SecurityTestResult> {
    try {
      // Try to inject a script and see if CSP blocks it
      let cspBlocked = false;
      let cspHeader = '';

      // Listen for console errors that might indicate CSP violations
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          cspBlocked = true;
        }
      });

      // Get CSP header from response
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        cspHeader = response?.headers()['content-security-policy'] || '';
      } catch (error) {
        // Continue with test even if navigation fails
      }

      // Try to execute inline script
      try {
        await page.evaluate(() => {
          const script = globalThis.document.createElement('script');
          script.innerHTML = 'globalThis.cspTestExecuted = true;';
          globalThis.document.head.appendChild(script);
        });
      } catch (error) {
        cspBlocked = true;
      }

      // Check if script executed
      const scriptExecuted = await page.evaluate(() => {
        return (globalThis as any).cspTestExecuted === true;
      });

      if (!cspHeader && scriptExecuted) {
        return {
          testName: 'csp_protection_test',
          owaspCategory: 'A05',
          severity: 'medium',
          status: 'fail',
          title: 'Missing Content Security Policy',
          description: 'No Content Security Policy header detected, inline scripts can execute',
          recommendation: 'Implement a strict Content Security Policy to prevent XSS attacks',
          confidence: 90,
        };
      }

      if (cspHeader && !scriptExecuted) {
        return {
          testName: 'csp_protection_test',
          owaspCategory: 'A05',
          severity: 'info',
          status: 'pass',
          title: 'Content Security Policy Active',
          description: 'CSP header present and blocking inline script execution',
          evidence: { csp_header: cspHeader },
          confidence: 85,
        };
      }

      return {
        testName: 'csp_protection_test',
        owaspCategory: 'A05',
        severity: 'low',
        status: 'warning',
        title: 'CSP Configuration Review Needed',
        description: 'CSP header present but may not be optimally configured',
        evidence: { 
          csp_header: cspHeader,
          script_executed: scriptExecuted 
        },
        recommendation: 'Review and strengthen Content Security Policy configuration',
        confidence: 70,
      };

    } catch (error) {
      return {
        testName: 'csp_protection_test',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'error',
        title: 'CSP Test Error',
        description: 'Unable to complete Content Security Policy test',
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0,
      };
    }
  }

  private static async testMixedContent(page: Page, url: string): Promise<SecurityTestResult> {
    try {
      const urlObj = new URL(url);
      
      // Only test HTTPS sites for mixed content
      if (urlObj.protocol !== 'https:') {
        return {
          testName: 'mixed_content_test',
          owaspCategory: 'A02',
          severity: 'info',
          status: 'pass',
          title: 'Mixed Content Test Skipped',
          description: 'Site uses HTTP, mixed content test not applicable',
          confidence: 100,
        };
      }

      const mixedContentIssues: string[] = [];

      // Listen for mixed content warnings
      page.on('console', msg => {
        if (msg.type() === 'warning' && msg.text().includes('Mixed Content')) {
          mixedContentIssues.push(msg.text());
        }
      });

      // Check for HTTP resources in HTTPS page
      await page.goto(url, { waitUntil: 'networkidle' });

      // Check all loaded resources
      const httpResources = await page.evaluate(() => {
        const resources: string[] = [];
        
        // Check images
        globalThis.document.querySelectorAll('img[src^="http:"]').forEach((img: any) => {
          resources.push(`Image: ${img.src}`);
        });
        
        // Check scripts
        globalThis.document.querySelectorAll('script[src^="http:"]').forEach((script: any) => {
          resources.push(`Script: ${script.src}`);
        });
        
        // Check stylesheets
        globalThis.document.querySelectorAll('link[href^="http:"]').forEach((link: any) => {
          resources.push(`Stylesheet: ${link.href}`);
        });

        return resources;
      });

      if (httpResources.length > 0 || mixedContentIssues.length > 0) {
        return {
          testName: 'mixed_content_test',
          owaspCategory: 'A02',
          severity: 'medium',
          status: 'fail',
          title: 'Mixed Content Detected',
          description: 'HTTPS page loading HTTP resources, which may be blocked by browsers',
          evidence: { 
            http_resources: httpResources,
            console_warnings: mixedContentIssues 
          },
          recommendation: 'Update all resource URLs to use HTTPS',
          confidence: 90,
        };
      }

      return {
        testName: 'mixed_content_test',
        owaspCategory: 'A02',
        severity: 'info',
        status: 'pass',
        title: 'No Mixed Content Detected',
        description: 'All resources loaded over HTTPS',
        confidence: 85,
      };

    } catch (error) {
      return {
        testName: 'mixed_content_test',
        owaspCategory: 'A02',
        severity: 'info',
        status: 'error',
        title: 'Mixed Content Test Error',
        description: 'Unable to complete mixed content test',
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0,
      };
    }
  }

  private static async testJavaScriptErrors(page: Page, url: string): Promise<SecurityTestResult> {
    try {
      const jsErrors: string[] = [];
      const sensitiveDataExposed: string[] = [];

      // Listen for JavaScript errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const errorText = msg.text();
          jsErrors.push(errorText);

          // Check for sensitive data in error messages
          if (this.containsSensitiveData(errorText)) {
            sensitiveDataExposed.push(errorText);
          }
        }
      });

      page.on('pageerror', error => {
        const errorText = error.message;
        jsErrors.push(errorText);

        if (this.containsSensitiveData(errorText)) {
          sensitiveDataExposed.push(errorText);
        }
      });

      // Navigate and wait for potential errors
      await page.goto(url, { waitUntil: 'networkidle' });

      if (sensitiveDataExposed.length > 0) {
        return {
          testName: 'javascript_errors_test',
          owaspCategory: 'A07',
          severity: 'high',
          status: 'fail',
          title: 'Sensitive Data in JavaScript Errors',
          description: 'JavaScript errors contain potentially sensitive information',
          evidence: { 
            sensitive_errors: sensitiveDataExposed,
            total_errors: jsErrors.length 
          },
          recommendation: 'Implement proper error handling to prevent sensitive data exposure',
          confidence: 95,
        };
      }

      if (jsErrors.length > 5) {
        return {
          testName: 'javascript_errors_test',
          owaspCategory: 'A05',
          severity: 'low',
          status: 'warning',
          title: 'Multiple JavaScript Errors',
          description: `${jsErrors.length} JavaScript errors detected, may indicate poor error handling`,
          evidence: { 
            error_count: jsErrors.length,
            sample_errors: jsErrors.slice(0, 3) 
          },
          recommendation: 'Review and fix JavaScript errors, implement proper error handling',
          confidence: 70,
        };
      }

      return {
        testName: 'javascript_errors_test',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'pass',
        title: 'JavaScript Errors Check Passed',
        description: `${jsErrors.length} JavaScript errors found (within acceptable range)`,
        confidence: 80,
      };

    } catch (error) {
      return {
        testName: 'javascript_errors_test',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'error',
        title: 'JavaScript Errors Test Failed',
        description: 'Unable to complete JavaScript errors analysis',
        evidence: { error: error instanceof Error ? error.message : 'Unknown error' },
        confidence: 0,
      };
    }
  }

  private static containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i,
      /auth/i,
      /private[_-]?key/i,
      /access[_-]?key/i,
      /database/i,
      /connection[_-]?string/i,
      /config/i,
      /\.env/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
  }
}