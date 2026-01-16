import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Request, RequestConfig, HttpMethod, RequestParam, RequestHeader, RequestBody, AuthConfig, PreRequestScript, TestScript } from '@/types/request';

export const useRequestStore = defineStore('request', () => {
  // State
  const currentRequest = ref<Request>(createDefaultRequest());
  const isSending = ref(false);

  // Computed
  const method = computed(() => currentRequest.value.method);
  const url = computed(() => currentRequest.value.url);
  const params = computed(() => currentRequest.value.params);
  const headers = computed(() => currentRequest.value.headers);
  const body = computed(() => currentRequest.value.body);
  const auth = computed(() => currentRequest.value.auth);
  const preRequestScript = computed(() => currentRequest.value.preRequestScript);
  const testScript = computed(() => currentRequest.value.testScript);

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
        raw: ''
      },
      auth: {
        type: 'noauth',
        config: {}
      },
      preRequestScript: {
        enabled: false,
        content: ''
      },
      testScript: {
        enabled: false,
        content: ''
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function setRequest(request: Partial<Request>) {
    currentRequest.value = {
      ...currentRequest.value,
      ...request,
      id: request.id || currentRequest.value.id,
      updatedAt: Date.now()
    };
  }

  function setMethod(method: HttpMethod) {
    currentRequest.value.method = method;
    currentRequest.value.updatedAt = Date.now();
  }

  function setUrl(url: string) {
    currentRequest.value.url = url;
    currentRequest.value.updatedAt = Date.now();
  }

  function setParams(params: RequestParam[]) {
    currentRequest.value.params = params;
    currentRequest.value.updatedAt = Date.now();
  }

  function addParam(param: RequestParam) {
    currentRequest.value.params.push(param);
    currentRequest.value.updatedAt = Date.now();
  }

  function updateParam(index: number, param: RequestParam) {
    currentRequest.value.params[index] = param;
    currentRequest.value.updatedAt = Date.now();
  }

  function removeParam(index: number) {
    currentRequest.value.params.splice(index, 1);
    currentRequest.value.updatedAt = Date.now();
  }

  function setHeaders(headers: RequestHeader[]) {
    currentRequest.value.headers = headers;
    currentRequest.value.updatedAt = Date.now();
  }

  function addHeader(header: RequestHeader) {
    currentRequest.value.headers.push(header);
    currentRequest.value.updatedAt = Date.now();
  }

  function updateHeader(index: number, header: RequestHeader) {
    currentRequest.value.headers[index] = header;
    currentRequest.value.updatedAt = Date.now();
  }

  function removeHeader(index: number) {
    currentRequest.value.headers.splice(index, 1);
    currentRequest.value.updatedAt = Date.now();
  }

  function setBody(body: RequestBody) {
    currentRequest.value.body = body;
    currentRequest.value.updatedAt = Date.now();
  }

  function setAuth(auth: AuthConfig) {
    currentRequest.value.auth = auth;
    currentRequest.value.updatedAt = Date.now();
  }

  function setPreRequestScript(script: PreRequestScript) {
    currentRequest.value.preRequestScript = script;
    currentRequest.value.updatedAt = Date.now();
  }

  function setTestScript(script: TestScript) {
    currentRequest.value.testScript = script;
    currentRequest.value.updatedAt = Date.now();
  }

  function resetRequest() {
    currentRequest.value = createDefaultRequest();
  }

  function loadRequest(request: Request) {
    currentRequest.value = {
      ...request,
      id: request.id || uuidv4(),
      createdAt: request.createdAt || Date.now(),
      updatedAt: Date.now()
    };
  }

  function exportConfig(): RequestConfig {
    return {
      method: currentRequest.value.method,
      url: currentRequest.value.url,
      params: currentRequest.value.params.filter(p => p.enabled),
      headers: currentRequest.value.headers.filter(h => h.enabled),
      body: currentRequest.value.body,
      auth: currentRequest.value.auth
    };
  }

  return {
    // State
    currentRequest,
    isSending,
    // Computed
    method,
    url,
    params,
    headers,
    body,
    auth,
    preRequestScript,
    testScript,
    // Actions
    createDefaultRequest,
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
    resetRequest,
    loadRequest,
    exportConfig
  };
});
