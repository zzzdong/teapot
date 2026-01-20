/**
 * Tauri API interface
 * Pure JS implementation - Tauri only serves as a container
 */
import { isTauri } from '@tauri-apps/api/core';

// Helper function to handle authentication
const handleAuth = (auth: any): Record<string, string> => {
  const headers: Record<string, string> = {};

  switch (auth.type) {
    case 'bearer':
      if (auth.bearer?.token) {
        headers['Authorization'] = `Bearer ${auth.bearer.token}`;
      }
      break;
    case 'basic':
      if (auth.basic?.username) {
        const credentials = btoa(`${auth.basic.username}:${auth.basic.password || ''}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
    case 'apikey':
      if (auth.apiKey?.key && auth.apiKey?.value) {
        if (auth.apiKey.addTo === 'header') {
          headers[auth.apiKey.key] = auth.apiKey.value;
        }
        // Note: Query params for API key are handled in URL construction
      }
      break;
  }

  return headers;
};

// Export isTauri for use in stores
export { isTauri };

// Store operations - fallback to localStorage when Tauri API is not available
let tauriStore: any = null;

// Initialize Tauri store instance
async function getTauriStore() {
  if (tauriStore) return tauriStore;

  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    // Tauri Store v2: use Store.load() instead of new Store()
    tauriStore = await Store.load('settings.json');
    return tauriStore;
  } catch (e) {
    console.warn('Failed to initialize Tauri store:', e);
    return null;
  }
}

export const store = {
  get: async (key: string) => {
    // Try Tauri store first
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const store = await getTauriStore();
        if (store) {
          const value = await store.get(key);
          return value !== null ? value : null;
        }
      } catch (e) {
        console.warn('Tauri store get failed, falling back to localStorage:', e);
      }
    }

    // Fallback to localStorage
    const data = localStorage.getItem(key);
    return data !== null ? JSON.parse(data) : null;
  },
  set: async (key: string, value: any) => {
    // Try Tauri store first
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const store = await getTauriStore();
        if (store) {
          await store.set(key, value);
          // Store v2 automatically saves modifications
          return;
        }
      } catch (e) {
        console.warn('Tauri store set failed, falling back to localStorage:', e);
      }
    }

    // Fallback to localStorage
    localStorage.setItem(key, JSON.stringify(value));
  },
  delete: async (key: string) => {
    // Try Tauri store first
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const store = await getTauriStore();
        if (store) {
          await store.delete(key);
          // Store v2 automatically saves modifications
          return;
        }
      } catch (e) {
        console.warn('Tauri store delete failed, falling back to localStorage:', e);
      }
    }

    // Fallback to localStorage
    localStorage.removeItem(key);
  },
  clear: async () => {
    // Try Tauri store first
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const store = await getTauriStore();
        if (store) {
          await store.clear();
          // Store v2 automatically saves modifications
          return;
        }
      } catch (e) {
        console.warn('Tauri store clear failed, falling back to localStorage:', e);
      }
    }

    // Fallback to localStorage
    localStorage.clear();
  },
  has: async (key: string) => {
    // Try Tauri store first
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const store = await getTauriStore();
        if (store) {
          const value = await store.get(key);
          return value !== null;
        }
      } catch (e) {
        console.warn('Tauri store has failed, falling back to localStorage:', e);
      }
    }

    // Fallback to localStorage
    return localStorage.getItem(key) !== null;
  }
};

// HTTP request operations - using custom Tauri command for maximum flexibility
export const request = {
  send: async (config: any) => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');

      // Validate URL
      if (!config.url) {
        throw new Error('URL is required');
      }

      // Load global settings and merge with request config
      const globalSettings = await store.get('http_client_config') || { };
      const mergedConfig = mergeRequestConfig(config, globalSettings);

      // Ensure URL has protocol
      let url = mergedConfig.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }

      // Build headers - always create object (empty if no headers)
      const headers: Record<string, string> = {};
      
      // Add configured headers
      if (mergedConfig.headers) {
        if (Array.isArray(mergedConfig.headers)) {
          mergedConfig.headers.forEach((header: any) => {
            if (header.enabled !== false && header.key) {
              headers[header.key] = header.value;
            }
          });
        } else if (typeof mergedConfig.headers === 'object') {
          Object.entries(mergedConfig.headers).forEach(([key, value]) => {
            headers[key] = value as string;
          });
        }
      }

      // Add authentication headers
      if (mergedConfig.auth && mergedConfig.auth.type !== 'noauth') {
        const authHeaders = handleAuth(mergedConfig.auth);
        Object.assign(headers, authHeaders);
      }

      // Build body as bytes
      let bodyBytes: number[] | undefined = undefined;
      if (mergedConfig.body && mergedConfig.body.type !== 'none') {
        switch (mergedConfig.body.type) {
          case 'raw':
            {
              const encoder = new TextEncoder();
              bodyBytes = Array.from(encoder.encode(mergedConfig.body.raw || ''));
              if (!headers['Content-Type']) {
                headers['Content-Type'] = 'text/plain';
              }
            }
            break;
          case 'form-data':
            // Form data - convert to URLSearchParams for simplicity
            {
              const formData = new URLSearchParams();
              mergedConfig.body.formData?.forEach((item: any) => {
                if (item.key && item.enabled !== false) {
                  formData.append(item.key, item.value || '');
                }
              });
              const encoder = new TextEncoder();
              bodyBytes = Array.from(encoder.encode(formData.toString()));
              if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
              }
            }
            break;
          case 'x-www-form-urlencoded':
            {
              const urlencodedData = new URLSearchParams();
              mergedConfig.body.urlencoded?.forEach((param: any) => {
                if (param.key && param.enabled !== false) {
                  urlencodedData.append(param.key, param.value || '');
                }
              });
              const encoder = new TextEncoder();
              bodyBytes = Array.from(encoder.encode(urlencodedData.toString()));
              if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
              }
            }
            break;
          case 'graphql':
            {
              const jsonStr = JSON.stringify(mergedConfig.body.graphql);
              const encoder = new TextEncoder();
              bodyBytes = Array.from(encoder.encode(jsonStr));
              if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
              }
            }
            break;
          case 'binary':
            // Direct binary data (file upload, base64 encoded, etc.)
            if (mergedConfig.body.binary) {
              if (typeof mergedConfig.body.binary === 'string') {
                // Base64 encoded string
                try {
                  const binaryString = atob(mergedConfig.body.binary);
                  bodyBytes = new Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bodyBytes[i] = binaryString.charCodeAt(i);
                  }
                } catch (e) {
                  // If base64 decode fails, treat as regular string
                  const encoder = new TextEncoder();
                  bodyBytes = Array.from(encoder.encode(mergedConfig.body.binary));
                }
              } else if (Array.isArray(mergedConfig.body.binary)) {
                // Already byte array
                bodyBytes = mergedConfig.body.binary;
              }
            }
            break;
        }
      }

      // Add query parameters
      if (mergedConfig.params && mergedConfig.params.length > 0) {
        const queryParams = new URLSearchParams();
        mergedConfig.params.forEach((param: any) => {
          if (param.enabled !== false && param.key) {
            queryParams.append(param.key, param.value || '');
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }

      // Build request config for Tauri command (configuration is managed by TS layer)
      const requestConfig = {
        url,
        method: mergedConfig.method,
        headers,
        body: bodyBytes,
        timeout: mergedConfig.timeout || undefined,  // Let Rust use default if not specified
        verify_ssl: mergedConfig.sslVerification !== false,
        follow_redirects: mergedConfig.followRedirects !== false,
        user_agent: mergedConfig.userAgent || undefined,
        ca_cert_paths: mergedConfig.caCertPaths || undefined,
        proxy: mergedConfig.proxy || undefined
      };

      // Call custom Tauri command
      const response = await invoke<HttpResponse>('send_request', { config: requestConfig });

      // Decode body from bytes based on content type
      let responseBody: any;
      const contentType = response.headers['content-type']?.toLowerCase() || '';

      if (contentType.includes('application/json')) {
        // Try to parse as JSON
        try {
          const textDecoder = new TextDecoder('utf-8');
          const text = textDecoder.decode(new Uint8Array(response.body));
          responseBody = JSON.parse(text);
        } catch (e) {
          // Fallback to text if JSON parsing fails
          const textDecoder = new TextDecoder('utf-8');
          responseBody = textDecoder.decode(new Uint8Array(response.body));
        }
      } else if (contentType.includes('application/octet-stream') ||
                 contentType.includes('image/') ||
                 contentType.includes('video/') ||
                 contentType.includes('audio/')) {
        // Keep as byte array for binary content
        responseBody = response.body;
      } else {
        // Decode as text for HTML, XML, plain text, etc.
        const textDecoder = new TextDecoder('utf-8');
        responseBody = textDecoder.decode(new Uint8Array(response.body));
      }

      return {
        id: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: responseBody,
        size: response.size,
        duration: response.duration,
        timestamp: Date.now()
      };
    } else {
      // Fallback to browser fetch when not in Tauri context (development)
      throw new Error('Tauri HTTP plugin not available. Use browser fetch for development.');
    }
  }
};

interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: number[];
  size: number;
  duration: number;
}

// WebSocket operations - placeholder (not implemented)
export const websocket = {
  connect: (url: string) => Promise.reject('WebSocket not implemented'),
  send: (id: string, data: string) => Promise.reject('WebSocket not implemented'),
  close: (id: string) => Promise.reject('WebSocket not implemented')
};

// File operations - placeholder (not implemented)
export const file = {
  read: (path: string) => Promise.reject('File operations not implemented'),
  write: (path: string, data: string) => Promise.reject('File operations not implemented'),
  select: () => Promise.reject('File operations not implemented')
};

// Script execution - placeholder (not implemented)
export const script = {
  execute: (code: string, context: any) => Promise.reject('Script execution not implemented')
};

// Default configuration constants
const DEFAULT_CONFIG = {
  USER_AGENT: 'Teapot/1.0',
  TIMEOUT: 30000,
  VERIFY_SSL: true,
  FOLLOW_REDIRECTS: true
};

/**
 * Merge request options with global settings
 * This allows per-request configuration to override defaults
 */
export const mergeRequestConfig = (requestConfig: any, globalSettings: any = {}) => {
  return {
    ...requestConfig,
    // Merge SSL verification setting
    sslVerification: requestConfig.sslVerification ?? globalSettings.verifySsl ?? DEFAULT_CONFIG.VERIFY_SSL,
    // Merge timeout
    timeout: requestConfig.timeout ?? globalSettings.defaultTimeout ?? DEFAULT_CONFIG.TIMEOUT,
    // Merge User-Agent - ensure it's never empty
    userAgent: requestConfig.userAgent ?? globalSettings.defaultUserAgent ?? DEFAULT_CONFIG.USER_AGENT,
    // Merge follow redirects setting
    followRedirects: requestConfig.followRedirects ?? globalSettings.followRedirects ?? DEFAULT_CONFIG.FOLLOW_REDIRECTS,
    // Merge CA certificate paths
    caCertPaths: requestConfig.caCertPaths ?? globalSettings.caCertPaths ?? undefined,
    // Merge proxy settings - request-level proxy can override global settings
    proxy: requestConfig.proxy ?? globalSettings.proxy ?? undefined
  };
};

// Environment operations - placeholder (not implemented)
export const env = {
  get: (key: string) => Promise.reject('Environment variables not implemented'),
  set: (key: string, value: any) => Promise.reject('Environment variables not implemented')
};

// HTTP Client configuration management
export const httpClient = {
  updateConfig: async (config: any) => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      // 转换为 camelCase 格式
      const rustConfig = {
        timeout: config.defaultTimeout || 30000,
        verify_ssl: config.verifySsl !== false,
        follow_redirects: config.followRedirects !== false,
        user_agent: config.defaultUserAgent || 'Teapot/1.0',
        ca_cert_paths: config.caCertPaths || [],
        proxy: config.proxy ? {
          enabled: config.proxy.enabled || false,
          host: config.proxy.host || '',
          port: config.proxy.port || 8080,
          protocol: config.proxy.protocol || 'http',
          username: config.proxy.username,
          password: config.proxy.password
        } : undefined
      };
      await invoke('update_config', { config: rustConfig });
    }
  },
  getConfig: async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('get_config');
    }
    return null;
  },
  clearCookies: async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('clear_cookies');
    }
  },
  getAllCookies: async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('get_all_cookies');
    }
    return [];
  },
  deleteCookie: async (domain: string, name: string) => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('delete_cookie', { domain, name });
    }
  },
  saveCookiesNow: async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_cookies_now');
    }
  },
  initCookieStorage: async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('init_cookie_storage');
    }
  }
};
