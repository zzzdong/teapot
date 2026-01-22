import type { Response, Cookie } from '@/types/response';

/**
 * Extract cookies from response headers
 * @param response - The response object
 * @returns Array of extracted cookies
 */
export function extractCookies(response: Response): Cookie[] {
  const cookies: Cookie[] = [];
  const setCookieHeader = response.headers['set-cookie'];

  if (setCookieHeader) {
    const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookiesArray.forEach((cookieString) => {
      const parts = cookieString.split(';');
      const [name, value] = parts[0].split('=');
      const cookie: Cookie = {
        name: name.trim(),
        value: value || '',
        domain: '',
        path: '/',
        httpOnly: false,
        secure: false,
      };

      parts.slice(1).forEach((part: string) => {
        const [key, val] = part.trim().split('=');
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'domain') cookie.domain = val || '';
        else if (lowerKey === 'path') cookie.path = val || '/';
        else if (lowerKey === 'expires') cookie.expires = val || '';
        else if (lowerKey === 'httponly') cookie.httpOnly = true;
        else if (lowerKey === 'secure') cookie.secure = true;
        else if (lowerKey === 'samesite') cookie.sameSite = val as any;
      });

      cookies.push(cookie);
    });
  }

  return cookies;
}

/**
 * Get formatted response body
 * @param response - The response object
 * @returns Formatted body string
 */
export function getFormattedBody(response: Response | undefined): string {
  if (!response) return '';

  const body = response.body;

  if (typeof body === 'object') {
    return JSON.stringify(body, null, 2);
  }

  if (typeof body === 'string') {
    return body;
  }

  return String(body);
}

/**
 * Get formatted body size
 * @param response - The response object
 * @returns Formatted size string
 */
export function getBodySize(response: Response | undefined): string {
  const bytes = response?.size ?? 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get formatted duration
 * @param response - The response object
 * @returns Formatted duration string
 */
export function getDuration(response: Response | undefined): string {
  const ms = response?.duration ?? 0;
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Download response content
 * @param response - The response object
 * @param filename - Optional filename for the download
 */
export function downloadResponse(response: Response, filename?: string): void {
  const content = getFormattedBody(response);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `response_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Check if response is successful
 * @param response - The response object
 * @returns True if response status is in 200-299 range
 */
export function isSuccess(response: Response | undefined): boolean {
  if (!response) return false;
  return response.status >= 200 && response.status < 300;
}

/**
 * Check if response is an error
 * @param response - The response object
 * @returns True if response status is 400 or higher
 */
export function isError(response: Response | undefined): boolean {
  if (!response) return false;
  return response.status >= 400;
}

/**
 * Get response status tag type for UI display
 * @param status - The response status code
 * @returns Tag type string
 */
export function getStatusTagType(status: number | null): string {
  if (!status) return 'default';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'warning';
  if (status >= 400 && status < 500) return 'error';
  if (status >= 500) return 'error';
  return 'default';
}

/**
 * Get content type from response headers
 * @param response - The response object
 * @returns Content type string
 */
export function getContentType(response: Response | undefined): string {
  if (!response) return '';
  const header = response.headers['content-type'] || '';
  return header.toLowerCase().split(';')[0];
}

/**
 * Check if response is JSON
 * @param response - The response object
 * @returns True if content type is JSON
 */
export function isJsonResponse(response: Response | undefined): boolean {
  const contentType = getContentType(response);
  return contentType === 'application/json' || contentType === 'application/vnd.api+json';
}

/**
 * Check if response is XML
 * @param response - The response object
 * @returns True if content type is XML
 */
export function isXmlResponse(response: Response | undefined): boolean {
  const contentType = getContentType(response);
  return contentType === 'application/xml' || contentType === 'text/xml' || contentType === 'application/atom+xml';
}

/**
 * Check if response is HTML
 * @param response - The response object
 * @returns True if content type is HTML
 */
export function isHtmlResponse(response: Response | undefined): boolean {
  const contentType = getContentType(response);
  return contentType === 'text/html' || contentType === 'application/xhtml+xml';
}

/**
 * Check if response is an image
 * @param response - The response object
 * @returns True if content type is an image
 */
export function isImageResponse(response: Response | undefined): boolean {
  const contentType = getContentType(response);
  return contentType.startsWith('image/');
}

/**
 * Format JSON response body
 * @param response - The response object
 * @returns Formatted JSON string
 */
export function formatJsonResponse(response: Response | undefined): string {
  if (!response) return '';

  const body = response.body;
  if (typeof body === 'string') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

/**
 * Convert response headers to array format for display
 * @param response - The response object
 * @returns Array of header objects
 */
export function headersToArray(response: Response | undefined): Array<{ key: string; value: string }> {
  const headers = response?.headers || {};
  return Object.entries(headers)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => ({ key, value: v }));
      }
      return { key, value: String(value) };
    })
    .flat();
}

/**
 * Get image source from response body
 * @param response - The response object
 * @returns Image source string
 */
export function getImageSource(response: Response | undefined): string {
  if (!response) return '';

  const body = response.body;
  if (typeof body === 'string' && body.startsWith('data:')) {
    return body;
  }
  return '';
}
