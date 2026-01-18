import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as tauriApi from '@/api/tauri-api';

export interface HttpClientSettings {
  verifySsl?: boolean;
  defaultTimeout?: number;
  defaultUserAgent?: string;
  followRedirects?: boolean;
  caCertPaths?: string[];
  proxy?: {
    enabled: boolean;
    host: string;
    port: number;
    username?: string;
    password?: string;
    protocol: 'http' | 'https' | 'socks5';
  };
}

export interface AppSettings {
  httpClient: HttpClientSettings;
  // 未来可以添加其他设置，例如 general、editor 等
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const httpClient = ref<HttpClientSettings>({
    verifySsl: true,
    defaultTimeout: 30000,
    defaultUserAgent: 'Teapot/1.0',
    followRedirects: true,
    caCertPaths: [],
    proxy: {
      enabled: false,
      host: '',
      port: 8080,
      protocol: 'http'
    }
  });

  // Actions
  async function load() {
    try {
      const stored = await tauriApi.store.get('http_client_config');
      if (stored && typeof stored === 'object') {
        // 深度合并，确保 proxy 等嵌套对象不被完全覆盖
        httpClient.value = deepMerge(httpClient.value, stored);
      }
    } catch (error) {
      console.error('Failed to load HTTP client settings:', error);
    }
  }

  async function save() {
    try {
      await tauriApi.store.set('http_client_config', httpClient.value);
    } catch (error) {
      console.error('Failed to save HTTP client settings:', error);
    }
  }

  function updateHttpClient(updates: Partial<HttpClientSettings>) {
    httpClient.value = deepMerge(httpClient.value, updates);
  }

  // 深度合并辅助函数
  function deepMerge(target: any, source: any): any {
    if (source === null || typeof source !== 'object') {
      return source;
    }
    if (typeof target !== 'object' || target === null) {
      target = {};
    }
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  // 初始化加载
  load();

  return {
    httpClient,
    load,
    save,
    updateHttpClient
  };
});