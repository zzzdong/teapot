import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Response, ResponseViewType, Cookie } from '@/types/response';
import type { ScriptResult, ScriptLogEntry } from '@/types/script';

export const useResponseStore = defineStore('response', () => {
  // State
  const currentResponse = ref<Response | null>(null);
  const viewType = ref<ResponseViewType>('pretty');
  const cookies = ref<Cookie[]>([]);
  const testResult = ref<ScriptResult | null>(null);
  const testLogs = ref<ScriptLogEntry[]>([]);

  // Computed
  const hasResponse = computed(() => currentResponse.value !== null);
  const status = computed(() => currentResponse.value?.status ?? null);
  const statusText = computed(() => currentResponse.value?.statusText ?? '');
  const body = computed(() => currentResponse.value?.body ?? null);
  const headers = computed(() => currentResponse.value?.headers ?? {});
  const size = computed(() => currentResponse.value?.size ?? 0);
  const duration = computed(() => currentResponse.value?.duration ?? 0);
  const timestamp = computed(() => currentResponse.value?.timestamp ?? 0);
  const isSuccess = computed(() => {
    if (!currentResponse.value) return false;
    return currentResponse.value.status >= 200 && currentResponse.value.status < 300;
  });
  const isError = computed(() => {
    if (!currentResponse.value) return false;
    return currentResponse.value.status >= 400;
  });

  // Actions
  function setResponse(response: Response) {
    currentResponse.value = response;
    extractCookies(response);
  }

  function setTestResult(result: ScriptResult) {
    testResult.value = result;
    testLogs.value = result.logs || [];
  }

  function clearResponse() {
    currentResponse.value = null;
    cookies.value = [];
    testResult.value = null;
    testLogs.value = [];
  }

  function setViewType(type: ResponseViewType) {
    viewType.value = type;
  }

  function extractCookies(response: Response) {
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      cookies.value = cookiesArray.map(cookieString => {
        const parts = cookieString.split(';');
        const [name, value] = parts[0].split('=');
        const cookie: Cookie = {
          name: name.trim(),
          value: value || '',
          domain: '',
          path: '/',
          httpOnly: false,
          secure: false
        };

        parts.slice(1).forEach(part => {
          const [key, val] = part.trim().split('=');
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'domain') cookie.domain = val || '';
          else if (lowerKey === 'path') cookie.path = val || '/';
          else if (lowerKey === 'expires') cookie.expires = val || '';
          else if (lowerKey === 'httponly') cookie.httpOnly = true;
          else if (lowerKey === 'secure') cookie.secure = true;
          else if (lowerKey === 'samesite') cookie.sameSite = val as any;
        });

        return cookie;
      });
    }
  }

  function getFormattedBody(): string {
    if (!currentResponse.value) return '';

    const body = currentResponse.value.body;
    const contentType = currentResponse.value.headers['content-type'] || '';

    if (typeof body === 'object') {
      return JSON.stringify(body, null, 2);
    }

    if (typeof body === 'string') {
      return body;
    }

    return String(body);
  }

  function getBodySize(): string {
    const bytes = size.value;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function getDuration(): string {
    const ms = duration.value;
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  function downloadResponse(filename?: string) {
    if (!currentResponse.value) return;

    const content = getFormattedBody();
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

  return {
    // State
    currentResponse,
    viewType,
    cookies,
    testResult,
    testLogs,
    // Computed
    hasResponse,
    status,
    statusText,
    body,
    headers,
    size,
    duration,
    timestamp,
    isSuccess,
    isError,
    testPassed: computed(() => testResult.value?.success ?? false),
    testError: computed(() => testResult.value?.error),
    // Actions
    setResponse,
    setTestResult,
    clearResponse,
    setViewType,
    extractCookies,
    getFormattedBody,
    getBodySize,
    getDuration,
    downloadResponse
  };
});
