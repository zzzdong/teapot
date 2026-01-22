import parseCurl from '@bany/curl-to-json';
import type { Request, RequestHeader, RequestBody, HttpMethod, FormDataItem } from '@/types/request';

/**
 * Parse cURL command and convert directly to Request format
 * Supports: form-data, x-www-form-urlencoded, raw (json/xml/text), binary, etc.
 */
export function curlToRequest(curlCommand: string): Request | null {
  try {
    // Remove 'curl ' from beginning if it exists
    if (!curlCommand.trim().toLowerCase().startsWith('curl')) {
      return null;
    }

    // Use @bany/curl-to-json to parse command
    const result = parseCurl(curlCommand);

    if (!result) {
      console.error('Failed to parse cURL command');
      return null;
    }

    // Parse URL to extract query params
    const urlObj = new URL(result.url);
    const params = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));

    // Remove query params from base URL
    const baseUrl = result.url.split('?')[0];

    // Parse headers
    const headers: RequestHeader[] = [];
    if (result.header) {
      Object.entries(result.header).forEach(([key, value]) => {
        headers.push({
          key,
          value: String(value),
          enabled: true,
        });
      });
    }

    // Parse body based on Content-Type and form data
    let body: RequestBody = { type: 'none' };
    const contentType = Object.keys(result.header || {}).find((h) => h.toLowerCase() === 'content-type');

    // Check for form-data (curl -F flag)
    if (result.form && result.form.length > 0) {
      body = {
        type: 'form-data',
        formData: result.form.map((formStr) => {
          // Parse form data string (key=value or key=@file)
          const [key, ...valueParts] = formStr.split('=');
          const value = valueParts.join('=');
          const isFile = value.startsWith('@');
          return {
            key,
            value: isFile ? value.substring(1) : value,
            type: isFile ? 'file' : 'text',
            enabled: true,
          } as FormDataItem;
        }),
      };
    } else if (result.data) {
      // Check Content-Type to determine body format
      if (contentType && result.header![contentType].includes('application/json')) {
        const dataStr = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        body = {
          type: 'raw',
          rawType: 'json',
          raw: dataStr,
        };
      } else if (contentType && result.header![contentType].includes('application/x-www-form-urlencoded')) {
        const dataStr =
          typeof result.data === 'string' ? result.data : new URLSearchParams(result.data as any).toString();
        const urlencodedParams = new URLSearchParams(dataStr);
        body = {
          type: 'x-www-form-urlencoded',
          urlencoded: Array.from(urlencodedParams.entries()).map(([key, value]) => ({
            key,
            value,
            enabled: true,
          })),
        };
      } else if (contentType && result.header![contentType].includes('multipart/form-data')) {
        // Parse multipart/form-data if provided as object
        if (typeof result.data === 'object') {
          body = {
            type: 'form-data',
            formData: Object.entries(result.data).map(([key, value]) => ({
              key,
              value: String(value),
              type: 'text',
              enabled: true,
            })),
          };
        } else {
          body = {
            type: 'raw',
            rawType: 'text',
            raw: String(result.data),
          };
        }
      } else {
        // Default to text/raw
        const dataStr = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        body = {
          type: 'raw',
          rawType: 'text',
          raw: dataStr,
        };
      }
    }

    // Build Request object
    const request: Request = {
      id: Date.now().toString(),
      name: `Imported from cURL`,
      method: (result.method || 'GET').toUpperCase() as HttpMethod,
      url: baseUrl,
      params,
      headers,
      body,
      auth: { type: 'noauth', config: {} },
      preRequestScript: { enabled: false, content: '' },
      testScript: { enabled: false, content: '' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return request;
  } catch (error) {
    console.error('Error parsing cURL command:', error);
    return null;
  }
}
