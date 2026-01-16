export interface ScriptLogEntry {
  level: 'info' | 'warn' | 'error' | 'log';
  message: string;
  timestamp: number;
}

export interface ScriptContext {
  environment: Record<string, any>;
  globals: Record<string, any>;
  collectionVariables?: Record<string, any>;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
}

export interface ScriptResult {
  success: boolean;
  error?: string;
  logs: ScriptLogEntry[];
  modifiedContext?: ScriptContext;
}

export interface PmApi {
  environment: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    unset: (key: string) => void;
    clear: () => void;
    has: (key: string) => boolean;
  };
  globals: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    unset: (key: string) => void;
    clear: () => void;
    has: (key: string) => boolean;
  };
  request: {
    url: {
      get: () => string;
      set: (url: string) => void;
    };
    headers: {
      get: () => Record<string, string>;
      set: (headers: Record<string, string>) => void;
    };
  };
  response?: {
    json: () => any;
    text: () => string;
    headers: {
      get: () => Record<string, string>;
    };
  };
  test: (name: string, fn: () => void) => void;
  expect: (value: any) => any;
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}
