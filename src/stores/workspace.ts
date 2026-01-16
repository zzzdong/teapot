import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { WorkspaceTab, Request } from '@/types';
import * as tauriApi from '@/api/tauri-api';

export const useWorkspaceStore = defineStore('workspace', () => {
  // State
  const tabs = ref<WorkspaceTab[]>([]);
  const activeTabId = ref<string | null>(null);

  // Computed
  const activeTab = computed(() => {
    return tabs.value.find(tab => tab.id === activeTabId.value) || null;
  });

  const activeRequest = computed(() => {
    return activeTab.value?.request || null;
  });

  // Helper: get request by tab id
  function getRequestByTabId(tabId: string): Request | null {
    const tab = tabs.value.find(t => t.id === tabId);
    return tab?.request || null;
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

  function createTab(request?: Partial<Request>): WorkspaceTab {
    const defaultRequest = createDefaultRequest();
    const mergedRequest = { ...defaultRequest, ...request };
    
    const tab: WorkspaceTab = {
      id: uuidv4(),
      request: mergedRequest,
      isActive: true,
      isModified: false,
      name: mergedRequest.name,
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
      // Try to activate the tab at the same index
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

    Object.assign(activeTab.value.request, updates, { updatedAt: Date.now() });
    activeTab.value.isModified = true;

    // Update tab name if request name changed
    if (updates.name) {
      activeTab.value.name = updates.name;
    }

    saveToStore();
  }

  function updateTabRequest(tabId: string, updates: Partial<Request>) {
    const tab = tabs.value.find(t => t.id === tabId);
    if (!tab) return;

    Object.assign(tab.request, updates, { updatedAt: Date.now() });
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
      tab.request.name = name;
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
        // Save tabs with request data
        await tauriApi.store.set('workspaceTabs', tabs.value.map(tab => ({
          id: tab.id,
          request: tab.request,
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

  async function loadFromStore() {
    try {
      if (tauriApi?.store) {
        const storedTabs = await tauriApi.store.get('workspaceTabs');
        const storedActiveTabId = await tauriApi.store.get('activeTabId');
        
        if (storedTabs && Array.isArray(storedTabs)) {
          tabs.value = storedTabs;
          
          // Restore active tab if it still exists
          if (storedActiveTabId) {
            const activeTabExists = tabs.value.find(t => t.id === storedActiveTabId);
            if (activeTabExists) {
              activeTabId.value = storedActiveTabId;
              tabs.value.forEach(tab => {
                tab.isActive = tab.id === storedActiveTabId;
              });
            } else if (tabs.value.length > 0) {
              // Activate the first tab if saved active tab doesn't exist
              activateTab(tabs.value[0].id);
            }
          } else if (tabs.value.length > 0) {
            // Activate the first tab
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
      activeTab.value.request = { ...request };
      activeTab.value.name = request.name;
      activeTab.value.isModified = false;
      saveToStore();
    }
  }

  return {
    // State
    tabs,
    activeTabId,
    // Computed
    activeTab,
    activeRequest,
    // Actions
    createTab,
    closeTab,
    activateTab,
    updateActiveTab,
    updateTabRequest,
    getRequestByTabId,
    updateTabName,
    markTabAsSaved,
    markActiveTabAsSaved,
    closeAllTabs,
    closeOtherTabs,
    closeAllOtherTabs,
    saveToStore,
    loadFromStore,
    loadRequestIntoNewTab,
    loadRequestIntoActiveTab
  };
});
