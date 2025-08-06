/**
 * URL utility functions for normalizing and validating URLs
 */

/**
 * Normalizes a URL by adding https:// if no protocol is present
 * @param url - The input URL that may or may not have a protocol
 * @returns The normalized URL with https:// protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;
  
  const trimmedUrl = url.trim();
  
  // If the URL already has a protocol, return as-is
  if (trimmedUrl.match(/^https?:\/\//)) {
    return trimmedUrl;
  }
  
  // Add https:// to URLs without protocol
  return `https://${trimmedUrl}`;
}

/**
 * Validates if a string is a potentially valid URL
 * @param url - The URL string to validate
 * @returns true if the URL appears to be valid
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    
    // Basic validation: must have a host and be http/https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts the domain name from a URL
 * @param url - The URL to extract domain from
 * @returns The domain name or empty string if invalid
 */
export function extractDomain(url: string): string {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch {
    return '';
  }
}