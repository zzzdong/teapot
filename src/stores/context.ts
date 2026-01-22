import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { RequestContext } from '@/types/context';
import type {
  Request,
  RequestConfig,
  HttpMethod,
  RequestParam,
  RequestHeader,
  RequestBody,
  AuthConfig,
  PreRequestScript,
  TestScript,
} from '@/types/request';
import type { Response, ResponseViewType, Cookie } from '@/types/response';
import type { ScriptResult } from '@/types/script';
import * as tauriApi from '@/api/tauri-api';

export const useContextStore = defineStore('context', () => {
  // State
  const contexts = ref<Map<string, RequestContext>>(new Map());
  const activeContextId = ref<string | null>(null);
  const viewTypes = ref<Map<string, ResponseViewType>>(new Map());

  // Computed
  const activeContext = computed(() => {
    if (!activeContextId.value) return null;
    return contexts.value.get(activeContextId.value) || null;
  });

  const activeRequest = computed(() => {
    return activeContext.value?.request || null;
  });

  const activeResponse = computed(() => {
    return activeContext.value?.response || null;
  });

  const activeTestResult = computed(() => {
    return activeContext.value?.testResult || null;
  });

  const hasResponse = computed(() => {
    return activeResponse.value !== undefined;
  });

  const status = computed(() => {
    return activeResponse.value?.status ?? null;
  });

  const statusText = computed(() => {
    return activeResponse.value?.statusText ?? '';
  });

  const body = computed(() => {
    return activeResponse.value?.body ?? null;
  });

  const headers = computed(() => {
    return activeResponse.value?.headers ?? {};
  });

  const size = computed(() => {
    return activeResponse.value?.size ?? 0;
  });

  const duration = computed(() => {
    return activeResponse.value?.duration ?? 0;
  });

  const timestamp = computed(() => {
    return activeResponse.value?.timestamp ?? 0;
  });

  const isSuccess = computed(() => {
    if (!activeResponse.value) return false;
    return activeResponse.value.status >= 200 && activeResponse.value.status < 300;
  });

  const isError = computed(() => {
    if (!activeResponse.value) return false;
    return activeResponse.value.status >= 400;
  });

  const testPassed = computed(() => {
    return activeTestResult.value?.success ?? false;
  });

  const testError = computed(() => {
    return activeTestResult.value?.error;
  });

  const activeViewType = computed(() => {
    if (!activeContextId.value) return 'pretty';
    return viewTypes.value.get(activeContextId.value) || 'pretty';
  });

  // Actions
  function createDefaultRequest(): Request {
    return {
      id: uuidv4(),
      name: 'New Request',
      method: 'GET',
      url: '',
      params: [],
      headers: [],
      body: {
        type: 'none',
        rawType: 'json',
        raw: '',
        formData: [],
        urlencoded: [],
        graphql: {
          query: '',
          variables: '{}',
        },
        binary: null,
      },
      auth: {
        type: 'noauth',
        config: {},
      },
      preRequestScript: {
        enabled: false,
        content: '',
      },
      testScript: {
        enabled: false,
        content: '',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  function createContext(request?: Partial<Request>): RequestContext {
    const defaultRequest = createDefaultRequest();
    const finalRequest = {
      ...defaultRequest,
      ...request,
      id: request?.id || defaultRequest.id,
      updatedAt: Date.now(),
    };

    const context: RequestContext = {
      request: finalRequest,
    };

    const contextId = uuidv4();
    contexts.value.set(contextId, context);
    viewTypes.value.set(contextId, 'pretty');

    return context;
  }

  function addContext(context: RequestContext): string {
    const contextId = uuidv4();
    contexts.value.set(contextId, context);
    viewTypes.value.set(contextId, 'pretty');
    return contextId;
  }

  function updateContext(contextId: string, updates: Partial<RequestContext>) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    if (updates.request) {
      context.request = {
        ...context.request,
        ...updates.request,
        updatedAt: Date.now(),
      };
    }

    if (updates.response !== undefined) {
      context.response = updates.response;
    }

    if (updates.testResult !== undefined) {
      context.testResult = updates.testResult;
    }

    if (updates.requestSentAt !== undefined) {
      context.requestSentAt = updates.requestSentAt;
    }

    if (updates.responseReceivedAt !== undefined) {
      context.responseReceivedAt = updates.responseReceivedAt;
    }

    contexts.value.set(contextId, context);
  }

  function deleteContext(contextId: string) {
    contexts.value.delete(contextId);
    viewTypes.value.delete(contextId);
    if (activeContextId.value === contextId) {
      activeContextId.value = null;
    }
  }

  function setActiveContext(contextId: string | null) {
    activeContextId.value = contextId;
  }

  function setRequest(contextId: string, request: Partial<Request>) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request = {
      ...context.request,
      ...request,
      id: request.id || context.request.id,
      updatedAt: Date.now(),
    };

    contexts.value.set(contextId, context);
  }

  function setMethod(contextId: string, method: HttpMethod) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.method = method;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setUrl(contextId: string, url: string) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.url = url;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setParams(contextId: string, params: RequestParam[]) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.params = params;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function addParam(contextId: string, param: RequestParam) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.params.push(param);
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function updateParam(contextId: string, index: number, param: RequestParam) {
    const context = contexts.value.get(contextId);
    if (!context || index < 0 || index >= context.request.params.length) return;

    context.request.params[index] = param;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function removeParam(contextId: string, index: number) {
    const context = contexts.value.get(contextId);
    if (!context || index < 0 || index >= context.request.params.length) return;

    context.request.params.splice(index, 1);
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setHeaders(contextId: string, headers: RequestHeader[]) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.headers = headers;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function addHeader(contextId: string, header: RequestHeader) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.headers.push(header);
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function updateHeader(contextId: string, index: number, header: RequestHeader) {
    const context = contexts.value.get(contextId);
    if (!context || index < 0 || index >= context.request.headers.length) return;

    context.request.headers[index] = header;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function removeHeader(contextId: string, index: number) {
    const context = contexts.value.get(contextId);
    if (!context || index < 0 || index >= context.request.headers.length) return;

    context.request.headers.splice(index, 1);
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setBody(contextId: string, body: RequestBody) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.body = body;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setAuth(contextId: string, auth: AuthConfig) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.auth = auth;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setPreRequestScript(contextId: string, script: PreRequestScript) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.preRequestScript = script;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setTestScript(contextId: string, script: TestScript) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.request.testScript = script;
    context.request.updatedAt = Date.now();
    contexts.value.set(contextId, context);
  }

  function setResponse(contextId: string, response: Response) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.response = response;
    contexts.value.set(contextId, context);
  }

  function setTestResult(contextId: string, result: ScriptResult) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.testResult = result;
    contexts.value.set(contextId, context);
  }

  function clearResponse(contextId: string) {
    const context = contexts.value.get(contextId);
    if (!context) return;

    context.response = undefined;
    context.testResult = undefined;
    contexts.value.set(contextId, context);
  }

  function setViewType(contextId: string, type: ResponseViewType) {
    viewTypes.value.set(contextId, type);
  }

  function extractCookies(response: Response): Cookie[] {
    const cookies: Cookie[] = [];
    const setCookieHeader = response.headers['set-cookie'] || response.headers['Set-Cookie'];

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

  function getFormattedBody(response?: Response): string {
    const targetResponse = response || activeResponse.value;
    if (!targetResponse) return '';

    const body = targetResponse.body;

    if (typeof body === 'object') {
      return JSON.stringify(body, null, 2);
    }

    if (typeof body === 'string') {
      return body;
    }

    return String(body);
  }

  function getBodySize(response?: Response): string {
    const bytes = response?.size ?? size.value;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function getDuration(response?: Response): string {
    const ms = response?.duration ?? duration.value;
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  function downloadResponse(contextId: string, filename?: string) {
    const context = contexts.value.get(contextId);
    if (!context?.response) return;

    const content = getFormattedBody(context.response);
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

  function exportConfig(contextId: string): RequestConfig {
    const context = contexts.value.get(contextId);
    if (!context) throw new Error('Context not found');

    const request = context.request;
    return {
      id: request.id,
      method: request.method,
      url: request.url,
      params: request.params.filter((p) => p.enabled),
      headers: request.headers.filter((h) => h.enabled),
      body: request.body,
      auth: request.auth,
    };
  }

  async function saveToStore() {
    try {
      if (tauriApi?.store) {
        const contextsToSave = Array.from(contexts.value.entries()).map(([id, context]) => ({
          id,
          context,
          viewType: viewTypes.value.get(id) || 'pretty',
        }));

        await tauriApi.store.set('contexts', contextsToSave);
        await tauriApi.store.set('activeContextId', activeContextId.value);
      }
    } catch (error) {
      console.error('Failed to save contexts:', error);
    }
  }

  async function loadFromStore() {
    try {
      if (tauriApi?.store) {
        const storedContexts = await tauriApi.store.get('contexts');
        const storedActiveContextId = await tauriApi.store.get('activeContextId');

        if (storedContexts && Array.isArray(storedContexts)) {
          const newContexts = new Map<string, RequestContext>();
          const newViewTypes = new Map<string, ResponseViewType>();

          storedContexts.forEach((item: any) => {
            if (item.id && item.context) {
              newContexts.set(item.id, item.context);
              newViewTypes.set(item.id, item.viewType || 'pretty');
            }
          });

          contexts.value = newContexts;
          viewTypes.value = newViewTypes;
          activeContextId.value = storedActiveContextId || null;
        }
      }
    } catch (error) {
      console.error('Failed to load contexts:', error);
    }
  }

  return {
    // State
    contexts,
    activeContextId,
    // Computed
    activeContext,
    activeRequest,
    activeResponse,
    activeTestResult,
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
    testPassed,
    testError,
    activeViewType,
    // Actions
    createContext,
    addContext,
    updateContext,
    deleteContext,
    setActiveContext,
    setRequest,
    setMethod,
    setUrl,
    setParams,
    addParam,
    updateParam,
    removeParam,
    setHeaders,
    addHeader,
    updateHeader,
    removeHeader,
    setBody,
    setAuth,
    setPreRequestScript,
    setTestScript,
    setResponse,
    setTestResult,
    clearResponse,
    setViewType,
    extractCookies,
    getFormattedBody,
    getBodySize,
    getDuration,
    downloadResponse,
    exportConfig,
    saveToStore,
    loadFromStore,
  };
});
