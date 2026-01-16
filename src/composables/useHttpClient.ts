import { ref } from 'vue';
import { useEnvironmentStore } from '@/stores/environment';
import { useConsoleStore } from '@/stores/console';
import type { RequestConfig, RequestBody, FormDataItem, PreRequestScript, TestScript } from '@/types/request';
import type { Response } from '@/types/response';
import type { ScriptContext } from '@/types/script';
import type { ScriptResult } from '@/types/script';
import { executeScript, validateScriptSyntax } from '@/utils/scriptExecutor';
import * as tauriApi from '@/api/tauri-api';

export function useHttpClient() {
  const isLoading = ref(false);

  const environmentStore = useEnvironmentStore();
  const consoleStore = useConsoleStore();

  function resolveBody(body: RequestBody): RequestBody {
    if (!body) return body;

    const resolved: RequestBody = {
      type: body.type
    };

    // Resolve raw body
    if (body.raw) {
      resolved.rawType = body.rawType;
      resolved.raw = environmentStore.resolveVariablesInText(body.raw);
    }

    // Resolve form-data body
    if (body.formData) {
      resolved.formData = body.formData.map((item: FormDataItem) => ({
        ...item,
        value: environmentStore.resolveVariablesInText(item.value)
      }));
    }

    // Resolve urlencoded body
    if (body.urlencoded) {
      resolved.urlencoded = body.urlencoded.map((param: any) => ({
        ...param,
        value: environmentStore.resolveVariablesInText(param.value)
      }));
    }

    // Resolve graphql body
    if (body.graphql) {
      resolved.graphql = {
        query: environmentStore.resolveVariablesInText(body.graphql.query),
        variables: environmentStore.resolveVariablesInText(body.graphql.variables)
      };
    }

    // Binary body doesn't need resolution
    if (body.binary) {
      resolved.binary = body.binary;
    }

    return resolved;
  }

  function resolveAuth(auth: any): any {
    if (!auth) return auth;

    const resolved: any = {
      type: auth.type,
      config: { ...auth.config }
    };

    // Resolve different auth types
    switch (auth.type) {
      case 'bearer':
        resolved.config.token = environmentStore.resolveVariablesInText(auth.config.token || '');
        resolved.config.prefix = environmentStore.resolveVariablesInText(auth.config.prefix || 'Bearer');
        break;

      case 'basic':
        resolved.config.username = environmentStore.resolveVariablesInText(auth.config.username || '');
        resolved.config.password = environmentStore.resolveVariablesInText(auth.config.password || '');
        break;

      case 'apikey':
        resolved.config.key = environmentStore.resolveVariablesInText(auth.config.key || '');
        resolved.config.value = environmentStore.resolveVariablesInText(auth.config.value || '');
        resolved.config.addTo = auth.config.addTo || 'header';
        break;

      case 'digest':
      case 'oauth1':
      case 'oauth2':
      case 'aws4':
        // Resolve all config values for these auth types
        if (auth.config) {
          Object.keys(auth.config).forEach(key => {
            resolved.config[key] = environmentStore.resolveVariablesInText(String(auth.config[key]));
          });
        }
        break;

      case 'noauth':
      default:
        break;
    }

    return resolved;
  }

  async function sendRequest(
    config: RequestConfig,
    preRequestScript?: PreRequestScript,
    testScript?: TestScript
  ): Promise<{ response: Response; testResult?: ScriptResult }> {
    isLoading.value = true;

    consoleStore.log(`Sending ${config.method} request to ${config.url}`);

    try {
      // Execute pre-request script if enabled
      let scriptContext: ScriptContext | undefined;
      if (preRequestScript?.enabled && preRequestScript?.content?.trim()) {
        consoleStore.info('Executing pre-request script...');

        // Validate script syntax
        const syntaxCheck = validateScriptSyntax(preRequestScript.content);
        if (!syntaxCheck.valid) {
          consoleStore.error('Pre-request script syntax error', syntaxCheck.error);
        } else {
          // Create script context
          scriptContext = {
            environment: { ...environmentStore.currentVariables },
            globals: environmentStore.globalVariables
              .filter(v => v.enabled)
              .reduce((acc, v) => ({ ...acc, [v.key]: v.value }), {}),
            request: {
              url: config.url,
              method: config.method,
              headers: config.headers?.reduce((acc: any, h: any) => {
                if (h.enabled) acc[h.key] = h.value;
                return acc;
              }, {}) || {},
              body: config.body
            }
          };

          // Execute pre-request script
          const scriptResult = await executeScript(preRequestScript.content, scriptContext);

          if (!scriptResult.success) {
            consoleStore.error('Pre-request script execution failed', scriptResult.error);
          } else {
            // Log script execution to console
            if (scriptResult.logs && scriptResult.logs.length > 0) {
              scriptResult.logs.forEach(log => {
                if (log.level === 'error') {
                  consoleStore.error(log.message, log.message);
                } else if (log.level === 'warn') {
                  consoleStore.warn(log.message);
                } else if (log.level === 'info') {
                  consoleStore.info(log.message);
                } else {
                  consoleStore.log(log.message);
                }
              });
            }

            // Update context from script execution
            if (scriptResult.modifiedContext) {
              // Determine which variables are new/modified
              const currentEnvVars = environmentStore.currentEnvironment?.variables || [];

              // Update environment variables (add to current environment)
              Object.entries(scriptResult.modifiedContext.environment).forEach(([key, value]) => {
                if (environmentStore.currentEnvironment) {
                  // Check if variable already exists in current environment
                  const existingIndex = currentEnvVars.findIndex(v => v.key === key);
                  if (existingIndex >= 0) {
                    environmentStore.updateVariableInEnvironment(
                      environmentStore.currentEnvironment.id,
                      existingIndex,
                      {
                        key,
                        value: String(value),
                        enabled: true
                      }
                    );
                  } else {
                    environmentStore.addVariableToEnvironment(
                      environmentStore.currentEnvironment.id,
                      {
                        key,
                        value: String(value),
                        enabled: true
                      }
                    );
                  }
                } else {
                  // No current environment, use local variables as fallback
                  environmentStore.setLocalVariable(key, value);
                }
              });

              // Update global variables
              Object.entries(scriptResult.modifiedContext.globals).forEach(([key, value]) => {
                const existingIndex = environmentStore.globalVariables.findIndex(v => v.key === key);
                if (existingIndex >= 0) {
                  environmentStore.updateGlobalVariable(existingIndex, {
                    key,
                    value: String(value),
                    enabled: true
                  });
                } else {
                  environmentStore.addGlobalVariable({
                    key,
                    value: String(value),
                    enabled: true
                  });
                }
              });

              // Update request config from script modifications
              if (scriptResult.modifiedContext.request) {
                config.url = scriptResult.modifiedContext.request.url;
                config.method = scriptContext.request.method as any;
              }
            }
          }
        }
      }

      // Resolve variables in URL
      const resolvedUrl = environmentStore.resolveVariablesInText(config.url);

      // Resolve variables in headers values
      const resolvedHeaders = config.headers?.map((header: any) => ({
        ...header,
        value: environmentStore.resolveVariablesInText(header.value)
      })) || [];

      // Resolve variables in params values
      const resolvedParams = config.params?.map((param: any) => ({
        ...param,
        value: environmentStore.resolveVariablesInText(param.value)
      })) || [];

      // Resolve variables in body
      const resolvedBody = config.body ? resolveBody(config.body) : undefined;

      // Resolve variables in auth
      const resolvedAuth = config.auth ? resolveAuth(config.auth) : undefined;

      // Send request using Tauri HTTP plugin
      const response = await tauriApi.request.send({
        method: config.method,
        url: resolvedUrl,
        headers: resolvedHeaders,
        params: resolvedParams,
        body: resolvedBody,
        auth: resolvedAuth,
        timeout: config.timeout || 30000
      });

      // Execute test script after response is received
      let testResult: ScriptResult | undefined;
      if (testScript?.enabled && testScript?.content?.trim()) {
        consoleStore.info('Executing test script...');

        // Validate script syntax
        const syntaxCheck = validateScriptSyntax(testScript.content);
        if (!syntaxCheck.valid) {
          consoleStore.error('Test script syntax error', syntaxCheck.error);
          testResult = {
            success: false,
            error: syntaxCheck.error,
            logs: [{
              level: 'error',
              message: `Syntax error: ${syntaxCheck.error}`,
              timestamp: Date.now()
            }],
            modifiedContext: undefined
          };
        } else {
          // Create script context with response data
          const scriptContext: ScriptContext = {
            environment: { ...environmentStore.currentVariables },
            globals: environmentStore.globalVariables
              .filter(v => v.enabled)
              .reduce((acc, v) => ({ ...acc, [v.key]: v.value }), {}),
            request: {
              url: config.url,
              method: config.method,
              headers: config.headers?.reduce((acc: any, h: any) => {
                if (h.enabled) acc[h.key] = h.value;
                return acc;
              }, {}) || {},
              body: config.body
            },
            response: {
              status: response.status,
              headers: response.headers,
              body: response.body
            }
          };

          // Execute test script
          testResult = await executeScript(testScript.content, scriptContext);

          // Log test script execution to console
          if (testResult.logs && testResult.logs.length > 0) {
            testResult.logs.forEach(log => {
              if (log.level === 'error') {
                consoleStore.error(log.message);
              } else if (log.level === 'warn') {
                consoleStore.warn(log.message);
              } else if (log.level === 'info') {
                consoleStore.info(log.message);
              } else {
                consoleStore.log(log.message);
              }
            });
          }
        }
      }

      consoleStore.info(`Request completed with status ${response.status}`);
      return { response, testResult };
    } catch (error: any) {
      consoleStore.error('Request failed', error?.message || String(error));
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    sendRequest: sendRequest as (config: RequestConfig, preRequestScript?: PreRequestScript, testScript?: TestScript) => Promise<{ response: Response; testResult?: ScriptResult }>
  };
}
