
import parser from 'yargs-parser'

/**
 * cURL Parser
 * Parse cURL command and convert to Request format
 */

export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  data: string | null;
}

/**
 * Tokenize command string respecting quotes
 */
function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens;
}

/**
 * Parse cURL command string
 */
export function parseCurlCommand(curlCommand: string): ParsedCurl | null {
  try {
    // Remove 'curl ' from the beginning if it exists
    if (!curlCommand.trim().toLowerCase().startsWith('curl')) {
      return null;
    }
    
    const command = curlCommand.trim().substring(4).trim();
    
    // Simple tokenizer to handle quoted strings
    const tokens = tokenizeCommand(command);
    
    let url = '';
    let method = 'GET';
    const headers: Record<string, string> = {};
    let data: string | null = null;
    let body: string | null = null;
    
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token.startsWith('--') || token.startsWith('-')) {
        const flag = token.substring(token.startsWith('--') ? 2 : 1);
        const nextToken = i + 1 < tokens.length ? tokens[i + 1] : '';
        
        if (flag === 'X' || flag === 'request') {
          // Handle -X METHOD or --request METHOD
          method = nextToken;
          i += 2;
        } else if (flag === 'H' || flag === 'header') {
          // Handle -H "Header: value" or --header "Header: value"
          const headerValue = nextToken;
          const colonIndex = headerValue.indexOf(':');
          if (colonIndex > 0) {
            const headerName = headerValue.substring(0, colonIndex).trim();
            const headerVal = headerValue.substring(colonIndex + 1).trim();
            headers[headerName] = headerVal;
          }
          i += 2;
        } else if (flag === 'd' || flag === 'data' || flag === 'data-raw' || flag === 'data-ascii') {
          // Handle -d/--data/--data-raw/--data-ascii
          data = nextToken;
          body = data;
          if (method === 'GET') method = 'POST';
          i += 2;
        } else if (flag === 'data-urlencode') {
          // Handle --data-urlencode
          data = nextToken;
          body = decodeURIComponent(data);
          if (method === 'GET') method = 'POST';
          i += 2;
        } else if (flag === 'u' || flag === 'user') {
          // Handle authentication
          const userPass = nextToken;
          const colonIndex = userPass.indexOf(':');
          if (colonIndex >= 0) {
            const user = userPass.substring(0, colonIndex);
            const pass = userPass.substring(colonIndex + 1);
            headers['Authorization'] = `Basic ${typeof btoa !== 'undefined' ? btoa(`${user}:${pass}`) : Buffer.from(`${user}:${pass}`).toString('base64')}`;
          }
          i += 2;
        } else {
          // Just skip unknown flags
          i++;
        }
      } else {
        // This should be the URL
        url = token;
        i++;
      }
    }
    
    // If no URL found, look for it in the original command
    if (!url) {
      // Find the URL in the original command string
      const urlRegex = /(https?:\/\/[^\s'"]+)/i;
      const match = curlCommand.match(urlRegex);
      if (match) {
        url = match[1];
      }
    }
    
    return {
      method,
      url,
      headers,
      body,
      data
    };
  } catch (error) {
    console.error('Error parsing cURL command:', error);
    return null;
  }
}

/**
 * Convert parsed cURL to Request format
 */
export function parsedCurlToRequest(parsed: ParsedCurl) {
  const headers = Object.entries(parsed.headers).map(([key, value]) => ({
    key,
    value,
    enabled: true
  }));

  let body: any = {
    type: 'none'
  };

  if (parsed.body) {
    try {
      const contentType = Object.keys(parsed.headers).find(h => h.toLowerCase() === 'content-type');
      if (contentType && parsed.headers[contentType].includes('application/json')) {
        body = {
          type: 'raw',
          rawType: 'json',
          raw: parsed.body
        };
      } else if (contentType && parsed.headers[contentType].includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(parsed.body);
        body = {
          type: 'x-www-form-urlencoded',
          urlencoded: Array.from(params.entries()).map(([key, value]) => ({
            key,
            value,
            enabled: true
          }))
        };
      } else {
        body = {
          type: 'raw',
          rawType: 'text',
          raw: parsed.body
        };
      }
    } catch (e) {
      body = {
        type: 'raw',
        rawType: 'text',
        raw: parsed.body
      };
    }
  }

  return {
    method: parsed.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
    url: parsed.url,
    headers,
    body
  };
}
