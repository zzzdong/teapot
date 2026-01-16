import { useWorkspaceStore } from '@/stores/workspace';
import { useRequestStore } from '@/stores/request';
import { watch } from 'vue';

export function useWorkspace() {
  const workspaceStore = useWorkspaceStore();
  const requestStore = useRequestStore();

  // Sync active tab request with request store
  watch(
    () => workspaceStore.activeRequest,
    (newRequest) => {
      if (newRequest) {
        requestStore.setRequest(newRequest);
      }
    },
    { deep: true }
  );

  // Watch request changes and update active tab
  watch(
    () => requestStore.currentRequest,
    (newRequest) => {
      if (newRequest && workspaceStore.activeTab) {
        workspaceStore.updateActiveTab(newRequest);
      }
    },
    { deep: true }
  );

  return workspaceStore;
}
