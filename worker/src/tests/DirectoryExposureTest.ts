import axios from 'axios';
import type { SecurityTestResult } from '../types';

export class DirectoryExposureTest {
  static async run(url: string): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];
    const baseUrl = new URL(url);
    
    // Common sensitive paths to check
    const sensitivePaths = [
      // Configuration files
      '.env',
      '.env.local',
      '.env.production',
      'config.php',
      'config.yml',
      'config.json',
      'settings.php',
      'wp-config.php',
      
      // Version control
      '.git/',
      '.git/config',
      '.git/HEAD',
      '.svn/',
      '.hg/',
      
      // Admin panels
      'admin/',
      'administrator/',
      'wp-admin/',
      'phpmyadmin/',
      'adminer.php',
      
      // Backup files
      'backup/',
      'backups/',
      'dump.sql',
      'database.sql',
      'db.sql',
      
      // Development files
      'composer.json',
      'package.json',
      'yarn.lock',
      'Gemfile',
      'requirements.txt',
      
      // Server files
      'server-status',
      'server-info',
      'phpinfo.php',
      '.htaccess',
      'web.config',
      
      // Documentation
      'README.md',
      'CHANGELOG.md',
      'docs/',
      
      // Logs
      'logs/',
      'log/',
      'error.log',
      'access.log',
      
      // Common directories
      'uploads/',
      'files/',
      'assets/',
      'static/',
      'tmp/',
      'temp/',
    ];

    const foundPaths: string[] = [];
    const checkedPaths: string[] = [];

    for (const path of sensitivePaths) {
      try {
        const testUrl = new URL(path, baseUrl).toString();
        checkedPaths.push(path);
        
        const response = await axios.get(testUrl, {
          timeout: 5000,
          validateStatus: (status) => status < 500, // Don't treat 4xx as errors
          maxRedirects: 2,
        });

        // Check if path is accessible
        if (response.status === 200) {
          foundPaths.push(path);
          
          const severity = this.getSeverityForPath(path);
          const details = this.getPathDetails(path, response);
          
          results.push({
            testName: 'directory_exposure',
            owaspCategory: 'A05',
            severity,
            status: 'fail',
            title: `Exposed Path: ${path}`,
            description: details.description,
            impact: details.impact,
            recommendation: details.recommendation,
            evidence: {
              path,
              url: testUrl,
              status_code: response.status,
              content_type: response.headers['content-type'],
              content_length: response.headers['content-length'],
              response_preview: this.getResponsePreview(response.data),
            },
            references: [
              'https://owasp.org/www-project-top-ten/2017/A06_2017-Security_Misconfiguration'
            ],
            confidence: 95,
          });
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        // Silently continue - most paths should return 404
        continue;
      }
    }

    // If no sensitive paths were found, add a positive result
    if (foundPaths.length === 0) {
      results.push({
        testName: 'directory_exposure',
        owaspCategory: 'A05',
        severity: 'info',
        status: 'pass',
        title: 'No Sensitive Paths Exposed',
        description: 'Common sensitive paths and files are not publicly accessible',
        evidence: {
          checked_paths: checkedPaths.length,
          sample_paths: sensitivePaths.slice(0, 10),
        },
        confidence: 85,
      });
    }

    return results;
  }

  private static getSeverityForPath(path: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalPaths = ['.env', '.git/config', 'config.php', 'wp-config.php', 'database.sql'];
    const highPaths = ['.git/', 'admin/', 'phpmyadmin/', 'backup/', 'dump.sql'];
    const mediumPaths = ['phpinfo.php', 'server-status', '.htaccess', 'composer.json'];
    
    if (criticalPaths.some(p => path.includes(p))) return 'critical';
    if (highPaths.some(p => path.includes(p))) return 'high';
    if (mediumPaths.some(p => path.includes(p))) return 'medium';
    return 'low';
  }

  private static getPathDetails(path: string, response: any): {
    description: string;
    impact: string;
    recommendation: string;
  } {
    if (path.includes('.env')) {
      return {
        description: 'Environment configuration file is publicly accessible',
        impact: 'May expose database credentials, API keys, and other sensitive configuration',
        recommendation: 'Block access to .env files in web server configuration',
      };
    }
    
    if (path.includes('.git')) {
      return {
        description: 'Git repository files are publicly accessible',
        impact: 'Source code, commit history, and potentially sensitive data may be exposed',
        recommendation: 'Block access to .git directory in web server configuration',
      };
    }
    
    if (path.includes('admin') || path.includes('phpmyadmin')) {
      return {
        description: 'Administrative interface is publicly accessible',
        impact: 'May allow unauthorized access to administrative functions',
        recommendation: 'Restrict admin panel access to authorized IP addresses only',
      };
    }
    
    if (path.includes('backup') || path.includes('.sql')) {
      return {
        description: 'Backup or database file is publicly accessible',
        impact: 'May expose entire database contents including user data',
        recommendation: 'Move backup files outside web root or implement access controls',
      };
    }
    
    if (path.includes('phpinfo')) {
      return {
        description: 'PHP configuration information is publicly accessible',
        impact: 'Exposes server configuration and potentially sensitive environment variables',
        recommendation: 'Remove phpinfo.php file or restrict access',
      };
    }
    
    return {
      description: 'Sensitive file or directory is publicly accessible',
      impact: 'May expose sensitive information or system configuration',
      recommendation: 'Review and restrict access to sensitive files and directories',
    };
  }

  private static getResponsePreview(data: any): string {
    if (typeof data !== 'string') {
      return '[Non-text content]';
    }
    
    // Return first 200 characters of response
    return data.substring(0, 200) + (data.length > 200 ? '...' : '');
  }
}