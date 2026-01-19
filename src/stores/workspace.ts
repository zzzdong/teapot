import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceTab, Request, RequestContext } from '@/types';
import * as tauriApi from '@/api/tauri-api';

export const useWorkspaceStore = defineStore('workspace', () => {
  // State
  const tabs = ref<WorkspaceTab[]>([]);
  const activeTabId = ref<string | null>(null);
  const showConsole = ref(false);

  // Computed
  const activeTab = computed(() => {
    return tabs.value.find(tab => tab.id === activeTabId.value) || null;
  });

  const activeContext = computed(() => {
    return activeTab.value?.context || null;
  });

  // Derived computed for backward compatibility
  const activeRequest = computed(() => {
    return activeContext.value?.request || null;
  });

  // Debug function to log tab state
  function debugTabState() {
    console.log('=== Workspace Tab State ===');
    console.log('Number of tabs:', tabs.value.length);
    tabs.value.forEach((tab, index) => {
      console.log(`Tab ${index}:`, {
        id: tab.id,
        name: tab.name,
        hasContext: !!tab.context,
        hasRequest: !!tab.context?.request,
        testScript: tab.context?.request?.testScript
      });
    });
    console.log('Active tab ID:', activeTabId.value);
    console.log('===========================');
  }

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
          variables: '{}'
        },
        binary: null
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

  function createDefaultContext(): RequestContext {
    return {
      request: createDefaultRequest()
    };
  }

  function createTab(request?: Partial<Request>): WorkspaceTab {
    const defaultContext = createDefaultContext();
    if (request) {
      defaultContext.request = { ...defaultContext.request, ...request };
    }

    const tab: WorkspaceTab = {
      id: uuidv4(),
      context: defaultContext,
      isActive: true,
      isModified: false,
      name: defaultContext.request.name,
      createdAt: Date.now()
    };

    // Set all tabs to inactive first
    tabs.value.forEach(t => t.isActive = false);

    // Add new tab and make it active
    tabs.value.push(tab);
    activeTabId.value = tab.id;

    saveToStore();
    return tab;
  }

  function closeTab(tabId: string) {
    const index = tabs.value.findIndex(tab => tab.id === tabId);
    if (index === -1) return;

    const wasActive = tabs.value[index].id === activeTabId.value;
    tabs.value.splice(index, 1);

    // If closed tab was active, activate another tab
    if (wasActive && tabs.value.length > 0) {
      // Try to activate tab at same index
      const newIndex = Math.min(index, tabs.value.length - 1);
      activateTab(tabs.value[newIndex].id);
    } else if (tabs.value.length === 0) {
      activeTabId.value = null;
    }

    saveToStore();
  }

  function activateTab(tabId: string) {
    tabs.value.forEach(tab => {
      tab.isActive = tab.id === tabId;
    });
    activeTabId.value = tabId;
    saveToStore();
  }

  function updateActiveTab(updates: Partial<Request>) {
    if (!activeTab.value) return;

    Object.assign(activeTab.value.context.request, updates, { updatedAt: Date.now() });
    activeTab.value.isModified = true;

    // Update tab name if request name changed
    if (updates.name) {
      activeTab.value.name = updates.name;
    }

    saveToStore();
  }

  function updateTabContext(tabId: string, contextUpdates: Partial<RequestContext>) {
    const tab = tabs.value.find(t => t.id === tabId);
    if (!tab) return;

    // Update request
    if (contextUpdates.request) {
      Object.assign(tab.context.request, contextUpdates.request, { updatedAt: Date.now() });
    }

    // Update response
    if (contextUpdates.response) {
      tab.context.response = contextUpdates.response;
    }

    // Update test result
    if (contextUpdates.testResult) {
      tab.context.testResult = contextUpdates.testResult;
    }

    // Update timestamps
    if (contextUpdates.requestSentAt) {
      tab.context.requestSentAt = contextUpdates.requestSentAt;
    }
    if (contextUpdates.responseReceivedAt) {
      tab.context.responseReceivedAt = contextUpdates.responseReceivedAt;
    }

    tab.isModified = true;
    saveToStore();
  }

  function updateTabRequest(tabId: string, updates: Partial<Request>) {
    const tab = tabs.value.find(t => t.id === tabId);
    if (!tab) return;

    Object.assign(tab.context.request, updates, { updatedAt: Date.now() });
    tab.isModified = true;

    // Update tab name if request name changed
    if (updates.name) {
      tab.name = updates.name;
    }

    saveToStore();
  }

  function updateTabName(tabId: string, name: string) {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.name = name;
      tab.context.request.name = name;
      saveToStore();
    }
  }

  function markTabAsSaved(tabId: string) {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.isModified = false;
      saveToStore();
    }
  }

  function markActiveTabAsSaved() {
    if (activeTabId.value) {
      markTabAsSaved(activeTabId.value);
    }
  }

  function closeAllTabs() {
    tabs.value = [];
    activeTabId.value = null;
    saveToStore();
  }

  function closeOtherTabs(keepTabId: string) {
    tabs.value = tabs.value.filter(tab => tab.id === keepTabId);
    activateTab(keepTabId);
    saveToStore();
  }

  function closeAllOtherTabs() {
    if (activeTabId.value) {
      closeOtherTabs(activeTabId.value);
    }
  }

  async function saveToStore() {
    try {
      if (tauriApi?.store) {
        // Save tabs with context data
        await tauriApi.store.set('workspaceTabs', tabs.value.map(tab => ({
          id: tab.id,
          context: tab.context,
          isActive: tab.isActive,
          isModified: tab.isModified,
          name: tab.name,
          createdAt: tab.createdAt
        })));
        await tauriApi.store.set('activeTabId', activeTabId.value);
      }
    } catch (error) {
      console.error('Failed to save workspace tabs:', error);
    }
  }

  // Helper function to migrate old tab data format to new context format
  function migrateTabData(storedTab: any): WorkspaceTab {
    // If the tab already has a context field, use it as-is
    if (storedTab.context) {
      return storedTab as WorkspaceTab;
    }

    // Otherwise, migrate from old format (request field directly on tab)
    const defaultRequest = createDefaultRequest();
    const storedRequest = storedTab.request || {};

    // Merge stored request with default to ensure all fields are present
    const migratedRequest: Request = {
      ...defaultRequest,
      ...storedRequest,
      id: storedRequest.id || defaultRequest.id,
      name: storedRequest.name || defaultRequest.name,
      method: storedRequest.method || defaultRequest.method,
      url: storedRequest.url !== undefined ? storedRequest.url : defaultRequest.url,
      params: storedRequest.params || defaultRequest.params,
      headers: storedRequest.headers || defaultRequest.headers,
      body: storedRequest.body ? { ...defaultRequest.body, ...storedRequest.body } : defaultRequest.body,
      auth: storedRequest.auth ? { ...defaultRequest.auth, ...storedRequest.auth } : defaultRequest.auth,
      preRequestScript: storedRequest.preRequestScript || defaultRequest.preRequestScript,
      testScript: storedRequest.testScript || defaultRequest.testScript,
      createdAt: storedRequest.createdAt || defaultRequest.createdAt,
      updatedAt: storedRequest.updatedAt || defaultRequest.updatedAt
    };

    return {
      id: storedTab.id,
      context: {
        request: migratedRequest
      },
      isActive: storedTab.isActive || false,
      isModified: storedTab.isModified || false,
      name: storedTab.name || storedRequest.name || 'Untitled',
      createdAt: storedTab.createdAt || Date.now()
    };
  }

  async function loadFromStore() {
    try {
      if (tauriApi?.store) {
        const storedTabs = await tauriApi.store.get('workspaceTabs');
        const storedActiveTabId = await tauriApi.store.get('activeTabId');

        if (storedTabs && Array.isArray(storedTabs)) {
          // Migrate old tab data format to new context format
          tabs.value = storedTabs.map(migrateTabData);

          // Restore active tab if it still exists
          if (storedActiveTabId) {
            const activeTabExists = tabs.value.find(t => t.id === storedActiveTabId);
            if (activeTabExists) {
              activeTabId.value = storedActiveTabId;
              tabs.value.forEach(tab => {
                tab.isActive = tab.id === storedActiveTabId;
              });
            } else if (tabs.value.length > 0) {
              // Activate first tab if saved active tab doesn't exist
              activateTab(tabs.value[0].id);
            }
          } else if (tabs.value.length > 0) {
            // Activate first tab
            activateTab(tabs.value[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load workspace tabs:', error);
    }
  }

  function loadRequestIntoNewTab(request: Request) {
    createTab(request);
  }

  function loadRequestIntoActiveTab(request: Request) {
    if (!activeTab.value) {
      createTab(request);
    } else {
      activeTab.value.context.request = { ...request };
      activeTab.value.name = request.name;
      activeTab.value.isModified = false;
      saveToStore();
    }
  }
  // Helper function to clear all workspace data (for testing)
  async function clearWorkspaceData() {
    try {
      if (tauriApi?.store) {
        await tauriApi.store.delete('workspaceTabs');
        await tauriApi.store.delete('activeTabId');
        tabs.value = [];
        activeTabId.value = null;
        console.log('Workspace data cleared successfully');
      }
    } catch (error) {
      console.error('Failed to clear workspace data:', error);
    }
  }

  // Toggle console visibility
  function toggleConsole() {
    showConsole.value = !showConsole.value;
  }
  return {
    // State
    tabs,
    activeTabId,
    showConsole,
    // Computed
    activeTab,
    activeRequest,
    activeContext,
    // Actions
    createTab,
    closeTab,
    activateTab,
    updateActiveTab,
    updateTabRequest,
    updateTabContext,
    updateTabName,
    markTabAsSaved,
    markActiveTabAsSaved,
    closeAllTabs,
    closeOtherTabs,
    closeAllOtherTabs,
    saveToStore,
    loadFromStore,
    loadRequestIntoNewTab,
    loadRequestIntoActiveTab,
    toggleConsole,
    debugTabState,
    clearWorkspaceData
  };
});
