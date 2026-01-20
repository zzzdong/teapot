import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Environment, EnvironmentVariable, VariableScope } from '@/types/environment';
import * as tauriApi from '@/api/tauri-api';

export const useEnvironmentStore = defineStore('environment', () => {
  // State
  const environments = ref<Environment[]>([]);
  const currentEnvironmentId = ref<string | null>(null);
  const globalVariables = ref<EnvironmentVariable[]>([]);
  const localVariables = ref<Record<string, any>>({});

  // Computed
  const currentEnvironment = computed(() => {
    if (!currentEnvironmentId.value) return null;
    return environments.value.find(env => env.id === currentEnvironmentId.value) || null;
  });

  const currentVariables = computed(() => {
    const vars: Record<string, any> = {};

    // Add global variables
    globalVariables.value
      .filter(v => v.enabled)
      .forEach(v => {
        vars[v.key] = resolveVariableValue(v.value);
      });

    // Add current environment variables
    if (currentEnvironment.value) {
      currentEnvironment.value.variables
        .filter(v => v.enabled)
        .forEach(v => {
          vars[v.key] = resolveVariableValue(v.value);
        });
    }

    // Add local variables
    Object.entries(localVariables.value).forEach(([key, value]) => {
      vars[key] = value;
    });

    return vars;
  });

  // Actions
  function createEnvironment(name: string): Environment {
    const env: Environment = {
      id: uuidv4(),
      name,
      variables: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    environments.value.push(env);
    saveToStore();
    return env;
  }

  function updateEnvironment(id: string, updates: Partial<Environment>) {
    const index = environments.value.findIndex(env => env.id === id);
    if (index !== -1) {
      environments.value[index] = {
        ...environments.value[index],
        ...updates,
        updatedAt: Date.now()
      };
      saveToStore();
    }
  }

  function deleteEnvironment(id: string) {
    environments.value = environments.value.filter(env => env.id !== id);
    if (currentEnvironmentId.value === id) {
      currentEnvironmentId.value = null;
    }
    saveToStore();
  }

  function setCurrentEnvironment(id: string | null) {
    currentEnvironmentId.value = id;
    saveToStore();
  }

  function addVariableToEnvironment(environmentId: string, variable: EnvironmentVariable) {
    const env = environments.value.find(e => e.id === environmentId);
    if (env) {
      env.variables.push(variable);
      env.updatedAt = Date.now();
      saveToStore();
    }
  }

  function updateVariableInEnvironment(environmentId: string, index: number, variable: EnvironmentVariable) {
    const env = environments.value.find(e => e.id === environmentId);
    if (env && env.variables[index]) {
      env.variables[index] = variable;
      env.updatedAt = Date.now();
      saveToStore();
    }
  }

  function deleteVariableFromEnvironment(environmentId: string, index: number) {
    const env = environments.value.find(e => e.id === environmentId);
    if (env) {
      env.variables.splice(index, 1);
      env.updatedAt = Date.now();
      saveToStore();
    }
  }

  function addGlobalVariable(variable: EnvironmentVariable) {
    globalVariables.value.push(variable);
    saveToStore();
  }

  function updateGlobalVariable(index: number, variable: EnvironmentVariable) {
    if (globalVariables.value[index]) {
      globalVariables.value[index] = variable;
      saveToStore();
    }
  }

  function deleteGlobalVariable(index: number) {
    globalVariables.value.splice(index, 1);
    saveToStore();
  }

  function setLocalVariable(key: string, value: any) {
    localVariables.value[key] = value;
  }

  function clearLocalVariables() {
    localVariables.value = {};
  }

  function getVariable(key: string, scope?: VariableScope): any {
    // Check local first
    if (localVariables.value[key] !== undefined && (!scope || scope === 'local')) {
      return localVariables.value[key];
    }

    // Check environment
    if (currentEnvironment.value && (!scope || scope === 'environment')) {
      const envVar = currentEnvironment.value.variables.find(v => v.key === key && v.enabled);
      if (envVar) {
        return resolveVariableValue(envVar.value);
      }
    }

    // Check global
    if (!scope || scope === 'global') {
      const globalVar = globalVariables.value.find(v => v.key === key && v.enabled);
      if (globalVar) {
        return resolveVariableValue(globalVar.value);
      }
    }

    return undefined;
  }

  function resolveVariableValue(value: string): string {
    // Handle dynamic variables
    const dynamicVars: Record<string, () => string> = {
      '{{$timestamp}}': () => String(Date.now()),
      '{{$randomInt}}': () => String(Math.floor(Math.random() * 1000)),
      '{{$guid}}': () => uuidv4(),
      '{{$randomUserName}}': () => `user_${Math.random().toString(36).substring(7)}`,
      '{{$randomEmail}}': () => `user${Math.random().toString(36).substring(7)}@example.com`,
      '{{$randomBoolean}}': () => String(Math.random() > 0.5),
      '{{$randomDate}}': () => new Date().toISOString(),
      '{{$randomTime}}': () => new Date().toTimeString(),
      '{{$randomCity}}': () => ['New York', 'London', 'Paris', 'Tokyo', 'Sydney'][Math.floor(Math.random() * 5)],
      '{{$randomCountry}}': () => ['USA', 'UK', 'France', 'Japan', 'Australia'][Math.floor(Math.random() * 5)],
      '{{$randomZipCode}}': () => Math.random().toString(36).substring(2, 7).toUpperCase()
    };

    if (dynamicVars[value]) {
      return dynamicVars[value]();
    }

    // Handle nested variables {{variable}}
    const nestedVarRegex = /\{\{([^}]+)\}\}/g;
    return value.replace(nestedVarRegex, (match, key) => {
      const resolved = getVariable(key.trim());
      return resolved !== undefined ? String(resolved) : match;
    });
  }

  function resolveVariablesInText(text: string): string {
    const varRegex = /\{\{([^}]+)\}\}/g;
    return text.replace(varRegex, (match, key) => {
      const resolved = getVariable(key.trim());
      return resolved !== undefined ? String(resolved) : match;
    });
  }

  function resolveVariablesInObject(obj: any): any {
    if (typeof obj === 'string') {
      return resolveVariablesInText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => resolveVariablesInObject(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = resolveVariablesInObject(value);
      }
      return result;
    }

    return obj;
  }

  function importVariables(variables: Record<string, any>, scope: VariableScope) {
    if (scope === 'global') {
      Object.entries(variables).forEach(([key, value]) => {
        addGlobalVariable({ key, value: String(value), enabled: true });
      });
    } else if (scope === 'environment' && currentEnvironment.value) {
      Object.entries(variables).forEach(([key, value]) => {
        addVariableToEnvironment(currentEnvironment.value!.id, {
          key,
          value: String(value),
          enabled: true
        });
      });
    } else if (scope === 'local') {
      Object.assign(localVariables.value, variables);
    }
  }

  function exportVariables(scope: VariableScope): Record<string, any> {
    if (scope === 'global') {
      const result: Record<string, any> = {};
      globalVariables.value.filter(v => v.enabled).forEach(v => {
        result[v.key] = v.value;
      });
      return result;
    } else if (scope === 'environment' && currentEnvironment.value) {
      const result: Record<string, any> = {};
      currentEnvironment.value.variables.filter(v => v.enabled).forEach(v => {
        result[v.key] = v.value;
      });
      return result;
    }
    return { ...localVariables.value };
  }

  function exportEnvironment(id: string): Environment | null {
    const env = environments.value.find(e => e.id === id);
    return env ? { ...env } : null;
  }

  function importEnvironment(env: Environment) {
    const existing = environments.value.find(e => e.id === env.id);
    if (existing) {
      const index = environments.value.indexOf(existing);
      environments.value[index] = { ...env };
    } else {
      environments.value.push({ ...env });
    }
    saveToStore();
  }

  function importEnvironments(envs: Environment[]) {
    envs.forEach(env => {
      importEnvironment(env);
    });
  }

  async function saveToStore() {
    try {
      const api = tauriApi;
      
      if (api) {
        await api.store.set('environments', environments.value);
        await api.store.set('currentEnvironmentId', currentEnvironmentId.value);
        await api.store.set('globalVariables', globalVariables.value);
      }
    } catch (error) {
      console.error('Failed to save environments:', error);
    }
  }

  async function loadFromStore() {
    try {
      const api = tauriApi;
      
      if (api) {
        const stored = await api.store.get('environments');
        if (stored) environments.value = stored;

        const currentId = await api.store.get('currentEnvironmentId');
        if (currentId) currentEnvironmentId.value = currentId;

        const globals = await api.store.get('globalVariables');
        if (globals) globalVariables.value = globals;
      }
    } catch (error) {
      console.error('Failed to load environments:', error);
    }
  }

  return {
    // State
    environments,
    currentEnvironmentId,
    globalVariables,
    localVariables,
    // Computed
    currentEnvironment,
    currentVariables,
    // Actions
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setCurrentEnvironment,
    addVariableToEnvironment,
    updateVariableInEnvironment,
    deleteVariableFromEnvironment,
    addGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable,
    setLocalVariable,
    clearLocalVariables,
    getVariable,
    resolveVariableValue,
    resolveVariablesInText,
    resolveVariablesInObject,
    importVariables,
    exportVariables,
    exportEnvironment,
    importEnvironment,
    importEnvironments,
    saveToStore,
    loadFromStore
  };
});
