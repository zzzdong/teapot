import type { ScriptContext, ScriptResult } from '@/types/script';

/**
 * ScriptLogEntry represents a single log entry from script execution
 */
export interface ScriptLogEntry {
  level: 'info' | 'warn' | 'error' | 'log';
  message: string;
  timestamp: number;
}

/**
 * Postman PM API implementation with isolated execution environment
 */
class PostmanApi {
  private context: ScriptContext;
  private logs: ScriptLogEntry[] = [];
  private modifiedRequest: any = {};

  constructor(context: ScriptContext) {
    this.context = this.deepClone(context);
    this.modifiedRequest = {
      url: this.context.request.url,
      method: this.context.request.method,
      headers: { ...this.context.request.headers },
    };
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private addLog(level: ScriptLogEntry['level'], message: string) {
    this.logs.push({
      level,
      message,
      timestamp: Date.now(),
    });
  }

  get environment() {
    const self = this;
    return {
      get(key: string): any {
        self.addLog('log', `pm.environment.get('${key}')`);
        return self.context.environment[key];
      },
      set(key: string, value: any) {
        self.addLog('info', `pm.environment.set('${key}', ${JSON.stringify(value)})`);
        self.context.environment[key] = value;
      },
      unset(key: string) {
        self.addLog('info', `pm.environment.unset('${key}')`);
        delete self.context.environment[key];
      },
      clear() {
        self.addLog('info', 'pm.environment.clear()');
        self.context.environment = {};
      },
      has(key: string): boolean {
        return key in self.context.environment;
      },
      toObject(): Record<string, any> {
        return { ...self.context.environment };
      },
      toString(): string {
        return JSON.stringify(self.context.environment);
      },
    };
  }

  get globals() {
    const self = this;
    return {
      get(key: string): any {
        self.addLog('log', `pm.globals.get('${key}')`);
        return self.context.globals[key];
      },
      set(key: string, value: any) {
        self.addLog('info', `pm.globals.set('${key}', ${JSON.stringify(value)})`);
        self.context.globals[key] = value;
      },
      unset(key: string) {
        self.addLog('info', `pm.globals.unset('${key}')`);
        delete self.context.globals[key];
      },
      clear() {
        self.addLog('info', 'pm.globals.clear()');
        self.context.globals = {};
      },
      has(key: string): boolean {
        return key in self.context.globals;
      },
      toObject(): Record<string, any> {
        return { ...self.context.globals };
      },
      toString(): string {
        return JSON.stringify(self.context.globals);
      },
    };
  }

  get request() {
    const self = this;
    return {
      url: {
        get(): string {
          return self.modifiedRequest.url;
        },
        set(url: string) {
          self.addLog('info', `pm.request.url.set('${url}')`);
          self.modifiedRequest.url = url;
        },
      },
      headers: {
        add(header: { key: string; value: string }) {
          self.addLog('info', `pm.request.headers.add(${JSON.stringify(header)})`);
          self.modifiedRequest.headers[header.key] = header.value;
        },
        remove(headerName: string) {
          self.addLog('info', `pm.request.headers.remove('${headerName}')`);
          delete self.modifiedRequest.headers[headerName];
        },
        get(): Record<string, string> {
          return { ...self.modifiedRequest.headers };
        },
        clear() {
          self.addLog('info', 'pm.request.headers.clear()');
          self.modifiedRequest.headers = {};
        },
        upsert(header: { key: string; value: string }) {
          self.addLog('info', `pm.request.headers.upsert(${JSON.stringify(header)})`);
          self.modifiedRequest.headers[header.key] = header.value;
        },
      },
      method: {
        get(): string {
          return self.modifiedRequest.method;
        },
        set(method: string) {
          self.addLog('info', `pm.request.method.set('${method}')`);
          self.modifiedRequest.method = method;
        },
      },
      body: {
        get(): any {
          return self.context.request.body;
        },
        set(body: any) {
          self.addLog('info', 'pm.request.body.set(...)');
          self.context.request.body = body;
        },
        update(options: any) {
          self.addLog('info', 'pm.request.body.update(...)');
          Object.assign(self.context.request.body, options);
        },
      },
    };
  }

  get response() {
    const self = this;
    return {
      json: () => {
        if (self.context.response?.body) {
          try {
            return typeof self.context.response.body === 'string'
              ? JSON.parse(self.context.response.body)
              : self.context.response.body;
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      text: () => {
        return typeof self.context.response?.body === 'string'
          ? self.context.response.body
          : JSON.stringify(self.context.response?.body);
      },
      headers: {
        all(): Record<string, string> {
          return { ...self.context.response?.headers };
        },
        get(headerName: string): string | undefined {
          return self.context.response?.headers[headerName];
        },
        has(headerName: string): boolean {
          return headerName in (self.context.response?.headers || {});
        },
      },
      code: () => self.context.response?.status || 0,
      status: () => {
        const code = self.context.response?.status || 0;
        if (code >= 200 && code < 300) return 'OK';
        if (code >= 300 && code < 400) return 'Redirect';
        if (code >= 400 && code < 500) return 'Client Error';
        if (code >= 500) return 'Server Error';
        return 'Unknown';
      },
      responseTime: () => 0, // Not tracked in current implementation
      responseSize: () => 0, // Not tracked in current implementation
      to: {
        have: {
          status: (code: number) => {
            const actualCode = self.context.response?.status || 0;
            if (actualCode !== code) {
              throw new Error(`Expected status ${code}, but got ${actualCode}`);
            }
            self.addLog('info', `Assertion passed: response status is ${code}`);
          },
          property: (prop: string) => {
            const body =
              typeof self.context.response?.body === 'string'
                ? JSON.parse(self.context.response?.body || '{}')
                : self.context.response?.body || {};
            if (typeof body !== 'object' || body === null || !(prop in body)) {
              throw new Error(`Expected response body to have property ${prop}`);
            }
            self.addLog('info', `Assertion passed: response body has property ${prop}`);
          },
          header: (headerName: string) => {
            if (!self.context.response?.headers || !(headerName in self.context.response.headers)) {
              throw new Error(`Expected response to have header ${headerName}`);
            }
            self.addLog('info', `Assertion passed: response has header ${headerName}`);
          },
          body: (expectedBody: string) => {
            const actualBody =
              typeof self.context.response?.body === 'string'
                ? self.context.response.body
                : JSON.stringify(self.context.response?.body);
            if (actualBody !== expectedBody) {
              throw new Error(`Expected response body to be ${expectedBody}, but got ${actualBody}`);
            }
            self.addLog('info', `Assertion passed: response body matches expected`);
          },
        },
        be: {
          ok: () => {
            const code = self.context.response?.status || 0;
            if (code < 200 || code >= 300) {
              throw new Error(`Expected response to be OK (2xx), but got ${code}`);
            }
            self.addLog('info', `Assertion passed: response is OK`);
          },
          an: (type: string) => {
            // This is used with pm.expect(), so value is passed through pm.expect()
            // The actual check is done in pm.expect()
            self.addLog('info', `Assertion: value is an ${type}`);
          },
        },
      },
    };
  }

  get test() {
    const self = this;
    return (name: string, fn: () => void) => {
      self.addLog('info', `Test: ${name}`);
      try {
        fn();
        self.addLog('info', `✓ Test passed: ${name}`);
      } catch (error) {
        self.addLog('error', `✗ Test failed: ${name} - ${error}`);
      }
    };
  }

  get expect() {
    const self = this;
    return (value: any) => {
      const assertions: any = {
        to: {
          be: {
            ok: () => {
              if (!value) throw new Error('Expected value to be ok');
              self.addLog('info', `Assertion passed: value is ok`);
            },
            true: () => {
              if (value !== true) throw new Error('Expected value to be true');
              self.addLog('info', `Assertion passed: value is true`);
            },
            false: () => {
              if (value !== false) throw new Error('Expected value to be false');
              self.addLog('info', `Assertion passed: value is false`);
            },
            null: () => {
              if (value !== null) throw new Error('Expected value to be null');
              self.addLog('info', `Assertion passed: value is null`);
            },
            undefined: () => {
              if (value !== undefined) throw new Error('Expected value to be undefined');
              self.addLog('info', `Assertion passed: value is undefined`);
            },
            empty: () => {
              if (Array.isArray(value) && value.length > 0) throw new Error('Expected array to be empty');
              if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
                throw new Error('Expected object to be empty');
              }
              if (typeof value === 'string' && value.length > 0) throw new Error('Expected string to be empty');
              self.addLog('info', `Assertion passed: value is empty`);
            },
            an: (type: string) => {
              if (type === 'array' && !Array.isArray(value)) {
                throw new Error(`Expected value to be an array`);
              }
              if (type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
                throw new Error(`Expected value to be an object`);
              }
              if (type === 'string' && typeof value !== 'string') {
                throw new Error(`Expected value to be a string`);
              }
              if (type === 'number' && typeof value !== 'number') {
                throw new Error(`Expected value to be a number`);
              }
              self.addLog('info', `Assertion passed: value is an ${type}`);
            },
            eql: (expected: any) => {
              if (JSON.stringify(value) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
              }
              self.addLog('info', `Assertion passed: value equals expected`);
            },
            above: (min: number) => {
              if (typeof value !== 'number' || value <= min) {
                throw new Error(`Expected ${value} to be above ${min}`);
              }
              self.addLog('info', `Assertion passed: value is above ${min}`);
            },
            below: (max: number) => {
              if (typeof value !== 'number' || value >= max) {
                throw new Error(`Expected ${value} to be below ${max}`);
              }
              self.addLog('info', `Assertion passed: value is below ${max}`);
            },
          },
          have: {
            property: (prop: string) => {
              if (typeof value !== 'object' || value === null || !(prop in value)) {
                throw new Error(`Expected object to have property ${prop}`);
              }
              self.addLog('info', `Assertion passed: object has property ${prop}`);
            },
            keys: (keys: string[]) => {
              if (typeof value !== 'object' || value === null) {
                throw new Error('Expected value to be an object');
              }
              const objKeys = Object.keys(value);
              const missingKeys = keys.filter((k) => !objKeys.includes(k));
              if (missingKeys.length > 0) {
                throw new Error(`Expected object to have keys: ${missingKeys.join(', ')}`);
              }
              self.addLog('info', `Assertion passed: object has all expected keys`);
            },
            length: (length: number) => {
              if (!Array.isArray(value) && typeof value !== 'string') {
                throw new Error('Expected value to be an array or string');
              }
              if (value.length !== length) {
                throw new Error(`Expected length ${length}, but got ${value.length}`);
              }
              self.addLog('info', `Assertion passed: value has length ${length}`);
            },
            lengthOf: (length: number) => {
              if (!Array.isArray(value) && typeof value !== 'string') {
                throw new Error('Expected value to be an array or string');
              }
              if (value.length !== length) {
                throw new Error(`Expected length ${length}, but got ${value.length}`);
              }
              self.addLog('info', `Assertion passed: value has length ${length}`);
            },
            status: (code: number) => {
              if (value !== code) {
                throw new Error(`Expected status ${code}, but got ${value}`);
              }
              self.addLog('info', `Assertion passed: status is ${code}`);
            },
          },
          include: (expected: any) => {
            if (Array.isArray(value)) {
              if (!value.includes(expected)) {
                throw new Error(`Expected array to include ${JSON.stringify(expected)}`);
              }
            } else if (typeof value === 'string') {
              if (!value.includes(String(expected))) {
                throw new Error(`Expected string to include ${expected}`);
              }
            } else if (typeof value === 'object' && value !== null) {
              const strValue = JSON.stringify(value);
              if (!strValue.includes(JSON.stringify(expected))) {
                throw new Error(`Expected object to include ${JSON.stringify(expected)}`);
              }
            } else {
              throw new Error('Cannot test inclusion on this type');
            }
            self.addLog('info', `Assertion passed: value includes expected`);
          },
          toMatch: (pattern: RegExp) => {
            if (typeof value !== 'string') {
              throw new Error('Expected value to be a string');
            }
            if (!pattern.test(value)) {
              throw new Error(`Expected '${value}' to match ${pattern}`);
            }
            self.addLog('info', `Assertion passed: value matches pattern`);
          },
          toContain: (expected: any) => {
            if (Array.isArray(value)) {
              if (!value.includes(expected)) {
                throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
              }
            } else if (typeof value === 'string') {
              if (!value.includes(String(expected))) {
                throw new Error(`Expected string to contain ${expected}`);
              }
            } else {
              throw new Error('Cannot test containment on this type');
            }
            self.addLog('info', `Assertion passed: value contains expected`);
          },
        },
        not: {
          be: {
            ok: () => {
              if (value) throw new Error('Expected value to not be ok');
              self.addLog('info', `Assertion passed: value is not ok`);
            },
            null: () => {
              if (value === null) throw new Error('Expected value to not be null');
              self.addLog('info', `Assertion passed: value is not null`);
            },
            undefined: () => {
              if (value === undefined) throw new Error('Expected value to not be undefined');
              self.addLog('info', `Assertion passed: value is not undefined`);
            },
            eql: (expected: any) => {
              if (JSON.stringify(value) === JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(value)} to not equal ${JSON.stringify(expected)}`);
              }
              self.addLog('info', `Assertion passed: value does not equal expected`);
            },
          },
          have: {
            property: (prop: string) => {
              if (typeof value === 'object' && value !== null && prop in value) {
                throw new Error(`Expected object to not have property ${prop}`);
              }
              self.addLog('info', `Assertion passed: object does not have property ${prop}`);
            },
          },
          include: (expected: any) => {
            if (Array.isArray(value) && value.includes(expected)) {
              throw new Error(`Expected array to not include ${JSON.stringify(expected)}`);
            }
            if (typeof value === 'string' && value.includes(String(expected))) {
              throw new Error(`Expected string to not include ${expected}`);
            }
            self.addLog('info', `Assertion passed: value does not include expected`);
          },
        },
      };

      return assertions;
    };
  }

  get info() {
    const self = this;
    return (message: string) => {
      self.addLog('info', message);
    };
  }

  get warn() {
    const self = this;
    return (message: string) => {
      self.addLog('warn', message);
    };
  }

  get error() {
    const self = this;
    return (message: string) => {
      self.addLog('error', message);
    };
  }

  get console() {
    const self = this;
    return {
      log: (...args: any[]) => {
        const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
        self.addLog('log', message);
      },
      info: (...args: any[]) => {
        const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
        self.addLog('info', message);
      },
      warn: (...args: any[]) => {
        const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
        self.addLog('warn', message);
      },
      error: (...args: any[]) => {
        const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
        self.addLog('error', message);
      },
    };
  }

  get variables() {
    const self = this;
    return {
      get(key: string): any {
        // Check environment first, then globals
        const envValue = self.context.environment[key];
        if (envValue !== undefined) {
          self.addLog('log', `pm.variables.get('${key}') -> environment`);
          return envValue;
        }
        self.addLog('log', `pm.variables.get('${key}') -> globals`);
        return self.context.globals[key];
      },
      set(key: string, value: any) {
        self.addLog('info', `pm.variables.set('${key}', ${JSON.stringify(value)})`);
        self.context.environment[key] = value;
      },
      unset(key: string) {
        self.addLog('info', `pm.variables.unset('${key}')`);
        delete self.context.environment[key];
        delete self.context.globals[key];
      },
      clear() {
        self.addLog('info', 'pm.variables.clear()');
        self.context.environment = {};
        self.context.globals = {};
      },
    };
  }

  get iteration() {
    return 0; // Not implemented yet
  }

  get cookies() {
    const self = this;
    return {
      get(cookieName?: string): any {
        // Return mock cookie object
        return null;
      },
      set(cookie: any) {
        self.addLog('info', `pm.cookies.set(${JSON.stringify(cookie)})`);
      },
      clear() {
        self.addLog('info', 'pm.cookies.clear()');
      },
      list() {
        return [];
      },
    };
  }

  get sendRequest() {
    const self = this;
    return async (requestOptions: string | any, callback?: (err: any, response: any) => void) => {
      self.addLog('info', 'pm.sendRequest called');
      // Mock implementation - would need actual HTTP client integration
      if (typeof requestOptions === 'string') {
        self.addLog('info', `Request URL: ${requestOptions}`);
      } else {
        self.addLog('info', `Request: ${JSON.stringify(requestOptions)}`);
      }
      // Callback-style
      if (callback) {
        callback(null, {
          status: 200,
          headers: {},
          json: () => ({}),
          text: () => '',
        });
        return undefined;
      }
      // Promise-style
      return Promise.resolve({
        status: 200,
        headers: {},
        json: () => ({}),
        text: () => '',
      });
    };
  }

  /**
   * Get the modified context after script execution
   */
  getModifiedContext(): ScriptContext {
    return {
      ...this.context,
      request: {
        ...this.context.request,
        url: this.modifiedRequest.url,
        method: this.modifiedRequest.method,
        headers: this.modifiedRequest.headers,
        body: this.context.request.body,
      },
    };
  }

  /**
   * Get all logs generated during script execution
   */
  getLogs(): ScriptLogEntry[] {
    return [...this.logs];
  }
}

/**
 * Execute a pre-request or test script in an isolated environment
 */
export async function executeScript(script: string, context: ScriptContext): Promise<ScriptResult> {
  const logs: ScriptLogEntry[] = [];
  let success = true;
  let error: string | undefined;
  let modifiedContext: ScriptContext | undefined;

  try {
    // Validate script before execution
    const validation = validateScriptSyntax(script);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create isolated Postman API
    const pm = new PostmanApi(context);

    // Create sandbox with limited access (Postman-style isolation)
    const sandbox = {
      // Postman API
      pm,
      console: pm.console,

      // Forbidden functions (use non-reserved names to avoid strict mode errors)
      _require: () => {
        throw new Error('require() is not allowed in scripts');
      },
      _eval: () => {
        throw new Error('eval() is not allowed in scripts');
      },
      _Function: () => {
        throw new Error('Function constructor is not allowed in scripts');
      },

      // Timers (disabled for security)
      setTimeout: () => {},
      setInterval: () => {},
      clearTimeout: () => {},
      clearInterval: () => {},

      // Safe built-in objects and functions
      Math: Math,
      Date: Date,
      JSON: JSON,
      parseInt: parseInt,
      parseFloat: parseFloat,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: {
        from: Array.from,
        isArray: Array.isArray,
        of: Array.of,
      },
      Object: {
        assign: Object.assign,
        entries: Object.entries,
        freeze: Object.freeze,
        fromEntries: Object.fromEntries,
        keys: Object.keys,
        values: Object.values,
        getOwnPropertyNames: Object.getOwnPropertyNames,
        getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
      },
      Error: Error,
      isNaN: isNaN,
      isFinite: isFinite,
      decodeURI: decodeURI,
      decodeURIComponent: decodeURIComponent,
      encodeURI: encodeURI,
      encodeURIComponent: encodeURIComponent,

      // Safe constructors
      Map: Map,
      Set: Set,
      RegExp: RegExp,
      Promise: Promise,
    };

    // Create function from script with sandbox
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const sandboxKeys = Object.keys(sandbox);

    // JavaScript reserved keywords that cannot be used as variable names
    const reservedKeywords = new Set([
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'export',
      'extends',
      'false',
      'finally',
      'for',
      'function',
      'if',
      'import',
      'in',
      'instanceof',
      'new',
      'null',
      'return',
      'super',
      'switch',
      'this',
      'throw',
      'true',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'yield',
      'await',
      'enum',
      'implements',
      'interface',
      'let',
      'package',
      'private',
      'protected',
      'public',
      'static',
    ]);

    // Skip reserved keywords when creating const declarations
    const sandboxVars = sandboxKeys
      .filter((key) => !reservedKeywords.has(key))
      .map((key) => `const ${key} = sandbox.${key};`)
      .join('\n');

    // Wrap script in IIFE to prevent variable leakage
    const wrappedScript = `
      (async function() {
        "use strict";
        ${sandboxVars}
        ${script}
      })();
    `;

    const scriptFunction = new AsyncFunction('sandbox', wrappedScript);

    // Execute script with sandbox environment
    await scriptFunction(sandbox);

    // Get results
    modifiedContext = pm.getModifiedContext();
    logs.push(...pm.getLogs());
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : String(err);
    logs.push({
      level: 'error',
      message: `Script execution error: ${error}`,
      timestamp: Date.now(),
    });
  }

  return {
    success,
    error,
    logs,
    modifiedContext,
  };
}

/**
 * Validate script syntax and security without executing
 */
export function validateScriptSyntax(script: string): { valid: boolean; error?: string } {
  try {
    // Check for forbidden patterns (more precise matching to avoid false positives)
    const forbiddenPatterns = [
      // Match eval() function call (not variable names)
      { pattern: /(?:^|[^\w.$])eval\s*\(/, message: 'eval() is not allowed in scripts' },
      // Match new Function() constructor
      { pattern: /(?:^|[^\w.$])new\s+Function\s*\(/, message: 'Function constructor is not allowed in scripts' },
      // Match require() function call
      { pattern: /(?:^|[^\w.$])require\s*\(/, message: 'require() is not allowed in scripts' },
      // Match import() function call (dynamic import, not variable names)
      { pattern: /(?:^|[^\w.$])import\s*\(/, message: 'import() is not allowed in scripts' },
      // Match process global variable access
      { pattern: /(?:^|[^\w.$])process(?:$|[^\w])/g, message: 'process is not allowed in scripts' },
      // Match global variable access
      { pattern: /(?:^|[^\w.$])global(?:$|[^\w])/g, message: 'global is not allowed in scripts' },
      // Match window object access
      { pattern: /(?:^|[^\w.$])window\s*\./, message: 'window object is not allowed in scripts' },
      // Match document object access
      { pattern: /(?:^|[^\w.$])document\s*\./, message: 'document object is not allowed in scripts' },
      // Match navigator object access
      { pattern: /(?:^|[^\w.$])navigator\s*\./, message: 'navigator object is not allowed in scripts' },
      // Match XMLHttpRequest usage
      {
        pattern: /(?:^|[^\w.$])XMLHttpRequest(?:$|[^\w])/g,
        message: 'XMLHttpRequest is not allowed in scripts, use pm.sendRequest instead',
      },
      // Match fetch() function call
      { pattern: /(?:^|[^\w.$])fetch\s*\(/, message: 'fetch() is not allowed in scripts, use pm.sendRequest instead' },
    ];

    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(script)) {
        return { valid: false, error: message };
      }
    }

    // Test syntax
    new Function(`"use strict"; ${script}`);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
