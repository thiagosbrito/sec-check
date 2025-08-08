/**
 * Scan validation service
 * Handles URL validation and security checks
 */

interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

export class ScanValidationService {
  /**
   * Validates URL protocol (only HTTP/HTTPS allowed)
   */
  static validateProtocol(url: URL): ValidationResult {
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS URLs are supported',
        code: 'INVALID_PROTOCOL'
      };
    }
    return { isValid: true };
  }

  /**
   * Checks for localhost/private IPs in production
   */
  static validateNetworkAccess(domain: string): ValidationResult {
    if (process.env.NODE_ENV === 'production') {
      const isLocalhost = domain === 'localhost' || 
                         domain === '127.0.0.1' || 
                         domain.startsWith('192.168.') ||
                         domain.startsWith('10.') ||
                         domain.startsWith('172.');
      
      if (isLocalhost) {
        return {
          isValid: false,
          error: 'Cannot scan local or private network addresses',
          code: 'PRIVATE_NETWORK'
        };
      }
    }
    return { isValid: true };
  }

  /**
   * Performs complete URL validation
   */
  static validateUrl(url: string): ValidationResult {
    try {
      const parsedUrl = new URL(url);
      
      // Check protocol
      const protocolCheck = this.validateProtocol(parsedUrl);
      if (!protocolCheck.isValid) {
        return protocolCheck;
      }

      // Check network access
      const networkCheck = this.validateNetworkAccess(parsedUrl.hostname);
      if (!networkCheck.isValid) {
        return networkCheck;
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format',
        code: 'INVALID_URL'
      };
    }
  }
}
