import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { HistoryItem, HistoryFilter } from '@/types/history';
import type { Request, RequestContext } from '@/types';
import * as tauriApi from '@/api/tauri-api';

export const useHistoryStore = defineStore('history', () => {
  // State
  const history = ref<HistoryItem[]>([]);
  const filter = ref<HistoryFilter>({});
  const maxItems = 100;

  // Computed
  const filteredHistory = computed(() => {
    let items = [...history.value];

    if (filter.value.method) {
      items = items.filter(item => item.request.method === filter.value.method);
    }

    if (filter.value.url) {
      const urlLower = filter.value.url.toLowerCase();
      items = items.filter(item =>
        item.request.url.toLowerCase().includes(urlLower)
      );
    }

    if (filter.value.status) {
      items = items.filter(item => {
        if (!item.response) return false;
        const status = item.response.status;
        if (filter.value.status === '2xx') return status >= 200 && status < 300;
        if (filter.value.status === '3xx') return status >= 300 && status < 400;
        if (filter.value.status === '4xx') return status >= 400 && status < 500;
        if (filter.value.status === '5xx') return status >= 500;
        return false;
      });
    }

    if (filter.value.startDate) {
      items = items.filter(item => item.timestamp >= filter.value.startDate!);
    }

    if (filter.value.endDate) {
      items = items.filter(item => item.timestamp <= filter.value.endDate!);
    }

    if (filter.value.favorited !== undefined) {
      items = items.filter(item => item.favorited === filter.value.favorited);
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  });

  const favoritedItems = computed(() => {
    return history.value.filter(item => item.favorited);
  });

  // Actions
  function addToHistory(context: RequestContext) {
    const request = context.request;
    const response = context.response;
    
    // Check if similar request exists
    const existingIndex = history.value.findIndex(
      item =>
        item.request.method === request.method &&
        item.request.url === request.url &&
        !item.favorited
    );

    const historyItem: HistoryItem = {
      id: uuidv4(),
      name: request.name || `${request.method} ${request.url}`,
      request: { ...request },
      response: response ? { ...response } : undefined,
      timestamp: Date.now(),
      favorited: false,
      executionCount: 1,
      lastExecutionAt: Date.now()
    };

    if (existingIndex !== -1) {
      // Update existing item
      const existing = history.value[existingIndex];
      historyItem.executionCount = existing.executionCount + 1;
      history.value.splice(existingIndex, 1);
    }

    history.value.unshift(historyItem);

    // Trim history to max items
    if (history.value.length > maxItems) {
      history.value = history.value.slice(0, maxItems);
    }

    // Keep favorited items
    const favorited = history.value.filter(item => item.favorited);
    history.value = [...favorited, ...history.value.filter(item => !item.favorited).slice(0, maxItems)];

    saveToStore();
  }

  function getHistoryItem(id: string): HistoryItem | undefined {
    return history.value.find(item => item.id === id);
  }

  function loadFromHistory(id: string): Request | null {
    const item = getHistoryItem(id);
    return item ? { ...item.request } : null;
  }

  function toggleFavorite(id: string) {
    const item = history.value.find(item => item.id === id);
    if (item) {
      item.favorited = !item.favorited;
      saveToStore();
    }
  }

  function deleteFromHistory(id: string) {
    history.value = history.value.filter(item => item.id !== id);
    saveToStore();
  }

  function clearHistory() {
    // Keep favorited items
    history.value = history.value.filter(item => item.favorited);
    saveToStore();
  }

  function clearFavorited() {
    history.value = [];
    saveToStore();
  }

  function setFilter(newFilter: Partial<HistoryFilter>) {
    filter.value = { ...filter.value, ...newFilter };
  }

  function clearFilter() {
    filter.value = {};
  }

  function exportHistory(): HistoryItem[] {
    return [...history.value];
  }

  function importHistory(items: HistoryItem[]) {
    // Merge with existing history
    const existingIds = new Set(history.value.map(item => item.id));
    items.forEach(item => {
      if (!existingIds.has(item.id)) {
        history.value.push(item);
      }
    });

    // Sort by timestamp
    history.value.sort((a, b) => b.timestamp - a.timestamp);

    saveToStore();
  }

  async function saveToStore() {
    try {
      const api = tauriApi;
      
      // Save only non-favorited items and basic info to save space
      const toSave = history.value.map(item => ({
        id: item.id,
        name: item.name,
        request: item.request,
        response: item.favorited ? item.response : undefined,
        timestamp: item.timestamp,
        favorited: item.favorited,
        executionCount: item.executionCount,
        lastExecutionAt: item.lastExecutionAt
      }));

      if (api) {
        await api.store.set('history', toSave);
      }
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  async function loadFromStore() {
    try {
      const api = tauriApi;
      
      if (api) {
        const stored = await api.store.get('history');
        if (stored) {
          history.value = stored.map((item: any) => ({
            ...item,
            response: item.response || undefined
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  return {
    // State
    history,
    filter,
    maxItems,
    // Computed
    filteredHistory,
    favoritedItems,
    // Actions
    addToHistory,
    getHistoryItem,
    loadFromHistory,
    toggleFavorite,
    deleteFromHistory,
    clearHistory,
    clearFavorited,
    setFilter,
    clearFilter,
    exportHistory,
    importHistory,
    saveToStore,
    loadFromStore
  };
});
