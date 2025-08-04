import type { ScanJobData, ScanJobProgress, ScanJobResult, SecurityTestResult } from './types';
import { SecurityHeadersTest } from './tests/SecurityHeadersTest';
import { CookieSecurityTest } from './tests/CookieSecurityTest';
import { DirectoryExposureTest } from './tests/DirectoryExposureTest';

export class SecurityScanner {
  private progressCallback?: (progress: ScanJobProgress) => void;

  constructor(progressCallback?: (progress: ScanJobProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async scan(jobData: ScanJobData): Promise<ScanJobResult> {
    const startTime = Date.now();
    const allResults: SecurityTestResult[] = [];
    
    // Define all security tests
    const securityTests = [
      { name: 'Security Headers', test: SecurityHeadersTest },
      { name: 'Cookie Security', test: CookieSecurityTest },
      { name: 'Directory Exposure', test: DirectoryExposureTest },
    ];

    const totalTests = securityTests.length;
    let completedTests = 0;

    try {
      // Initial progress
      this.updateProgress({
        stage: 'initializing',
        completedTests: 0,
        totalTests,
        message: 'Starting security scan...',
        percentage: 0,
      });

      // Validate URL accessibility
      this.updateProgress({
        stage: 'analyzing',
        completedTests: 0,
        totalTests,
        message: 'Analyzing target URL...',
        percentage: 5,
      });

      // Run each security test
      this.updateProgress({
        stage: 'testing',
        completedTests: 0,
        totalTests,
        message: 'Running security tests...',
        percentage: 10,
      });

      for (const { name, test } of securityTests) {
        try {
          this.updateProgress({
            stage: 'testing',
            completedTests,
            totalTests,
            currentTest: name,
            message: `Running ${name} test...`,
            percentage: 10 + (completedTests / totalTests) * 80,
          });

          const testResults = await test.run(jobData.url);
          allResults.push(...testResults);
          completedTests++;

          this.updateProgress({
            stage: 'testing',
            completedTests,
            totalTests,
            currentTest: name,
            message: `Completed ${name} test`,
            percentage: 10 + (completedTests / totalTests) * 80,
          });

        } catch (error) {
          console.error(`Test ${name} failed:`, error);
          
          // Add error result
          allResults.push({
            testName: name.toLowerCase().replace(/\s+/g, '_'),
            owaspCategory: 'A05',
            severity: 'info',
            status: 'error',
            title: `${name} Test Failed`,
            description: `Unable to complete ${name} test due to an error`,
            evidence: { 
              error: error instanceof Error ? error.message : 'Unknown error',
              test_name: name,
            },
            confidence: 0,
          });
          
          completedTests++;
        }
      }

      // Generate report
      this.updateProgress({
        stage: 'reporting',
        completedTests: totalTests,
        totalTests,
        message: 'Generating security report...',
        percentage: 95,
      });

      const summary = this.generateSummary(allResults);
      const executionTime = Date.now() - startTime;

      this.updateProgress({
        stage: 'completed',
        completedTests: totalTests,
        totalTests,
        message: 'Security scan completed successfully',
        percentage: 100,
      });

      return {
        scanId: jobData.scanId,
        status: 'completed',
        executionTime,
        results: allResults,
        ...summary,
      };

    } catch (error) {
      console.error('Security scan failed:', error);
      
      const executionTime = Date.now() - startTime;
      
      return {
        scanId: jobData.scanId,
        status: 'failed',
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: allResults,
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
      };
    }
  }

  private updateProgress(progress: ScanJobProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  private generateSummary(results: SecurityTestResult[]): {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
  } {
    const summary = {
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
    };

    results.forEach(result => {
      // Only count fails and warnings as vulnerabilities
      if (result.status === 'fail' || result.status === 'warning') {
        summary.totalVulnerabilities++;
        
        switch (result.severity) {
          case 'critical':
            summary.criticalCount++;
            break;
          case 'high':
            summary.highCount++;
            break;
          case 'medium':
            summary.mediumCount++;
            break;
          case 'low':
            summary.lowCount++;
            break;
          case 'info':
            summary.infoCount++;
            break;
        }
      }
    });

    return summary;
  }
}