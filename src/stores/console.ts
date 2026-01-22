import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ConsoleLog {
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: number;
}

export const useConsoleStore = defineStore('console', () => {
  const logs = ref<ConsoleLog[]>([]);

  function addLog(type: ConsoleLog['type'], message: string, data?: any) {
    logs.value.push({
      type,
      message,
      data,
      timestamp: Date.now(),
    });

    // Keep only last 100 logs to prevent memory issues
    if (logs.value.length > 100) {
      logs.value.shift();
    }
  }

  function log(message: string, data?: any) {
    addLog('log', message, data);
  }

  function info(message: string, data?: any) {
    addLog('info', message, data);
  }

  function warn(message: string, data?: any) {
    addLog('warn', message, data);
  }

  function error(message: string, data?: any) {
    addLog('error', message, data);
  }

  function clear() {
    logs.value = [];
  }

  return {
    logs,
    addLog,
    log,
    info,
    warn,
    error,
    clear,
  };
});
