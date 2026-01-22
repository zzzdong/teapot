<template>
  <div class="collections-panel">
    <div class="panel-header">
      <n-select
        v-model:value="currentCollectionId"
        :options="collectionOptions"
        placeholder="Select Collection"
        size="small"
        style="flex: 1"
        clearable
        @update:value="handleCollectionChange"
      />
      <n-button
        text
        size="small"
        @click="handleCreateCollection"
      >
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
      </n-button>
      <n-dropdown
        v-if="currentCollection"
        :options="collectionActionOptions"
        placement="bottom-end"
        trigger="click"
        @select="handleCollectionAction"
      >
        <n-button
          text
          size="small"
        >
          <template #icon>
            <n-icon><EllipsisVerticalOutline /></n-icon>
          </template>
        </n-button>
      </n-dropdown>
    </div>

    <n-scrollbar style="max-height: calc(100vh - 140px)">
      <div
        v-if="!currentCollection"
        class="empty-state"
      >
        <n-icon
          size="48"
          :color="'#ccc'"
        >
          <FolderOutline />
        </n-icon>
        <p>No collection selected</p>
        <p class="hint">Select a collection to manage your requests</p>
      </div>

      <div v-else>
        <div class="collection-info">
          <span class="collection-name">{{ currentCollection.name }}</span>
          <span class="item-count">{{ currentCollectionItems.length }} items</span>
        </div>

        <div
          v-if="currentCollectionItems.length === 0"
          class="no-items"
        >
          <p>No items in this collection</p>
          <div class="add-buttons">
            <n-button
              type="primary"
              size="small"
              @click="handleCreateFolder(currentCollection.id)"
            >
              <template #icon>
                <n-icon><AddCircleOutline /></n-icon>
              </template>
              Add Folder
            </n-button>
            <n-button
              type="primary"
              size="small"
              @click="handleCreateRequest(currentCollection.id)"
            >
              <template #icon>
                <n-icon><DocumentTextOutline /></n-icon>
              </template>
              Add Request
            </n-button>
          </div>
        </div>

        <div
          v-else
          class="items-tree"
        >
          <CollectionTreeItem
            v-for="item in currentCollectionItems"
            :key="item.id"
            :item="item"
            :depth="0"
            @select="handleSelectItem"
            @toggle="handleToggleExpand"
            @rename="handleRenameItem"
            @delete="handleDeleteItem"
            @add-request="handleCreateRequest"
          />
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NDropdown, NIcon, NSelect, NScrollbar, useDialog } from 'naive-ui';
import {
  AddOutline,
  FolderOutline,
  EllipsisVerticalOutline,
  CreateOutline,
  TrashOutline,
  AddCircleOutline,
  DocumentTextOutline,
  CopyOutline,
  DownloadOutline,
  CloudUploadOutline,
} from '@vicons/ionicons5';
import { useCollectionsStore } from '@/stores/collections';
import { useWorkspaceStore } from '@/stores/workspace';
import CollectionTreeItem from './CollectionTreeItem.vue';

const dialog = useDialog();
const collectionsStore = useCollectionsStore();
const workspaceStore = useWorkspaceStore();

const currentCollectionId = computed({
  get: () => collectionsStore.currentCollectionId,
  set: (value) => collectionsStore.setCurrentCollection(value),
});

const currentCollection = computed(() => collectionsStore.currentCollection);
const collectionOptions = computed(() => collectionsStore.collectionOptions);

const currentCollectionItems = computed(() => {
  if (!currentCollectionId.value) return [];
  return collectionsStore.collections.filter((item) => item.parentId === currentCollectionId.value);
});

function handleCollectionChange(value: string | null) {
  currentCollectionId.value = value;
}

function handleToggleExpand(id: string) {
  collectionsStore.toggleExpanded(id);
}

function handleSelectItem(item: any) {
  collectionsStore.setSelectedItem(item.id);
  // Load request into a new tab - use createTab directly
  workspaceStore.createTab(item.request);
}

function handleCreateCollection() {
  dialog.create({
    title: 'Create Collection',
    content: () =>
      h('input', {
        type: 'text',
        placeholder: 'Collection name',
        style: 'width: 100%; padding: 8px; margin-top: 8px;',
      }),
    positiveText: 'Create',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value) {
        const newCollection = collectionsStore.createCollection(input.value);
        collectionsStore.setCurrentCollection(newCollection.id);
      }
    },
  });
}

function handleCreateFolder(parentId: string) {
  dialog.create({
    title: 'Create Folder',
    content: () =>
      h('input', {
        type: 'text',
        placeholder: 'Folder name',
        style: 'width: 100%; padding: 8px; margin-top: 8px;',
      }),
    positiveText: 'Create',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value) {
        collectionsStore.createFolder(parentId, input.value);
      }
    },
  });
}

function handleCreateRequest(parentId: string) {
  dialog.create({
    title: 'Create Request',
    content: () =>
      h('input', {
        type: 'text',
        placeholder: 'Request name',
        style: 'width: 100%; padding: 8px; margin-top: 8px;',
      }),
    positiveText: 'Create',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value) {
        const defaultRequest = {
          id: crypto.randomUUID(),
          name: input.value,
          method: 'GET' as const,
          url: '',
          params: [],
          headers: [],
          body: {
            type: 'none' as const,
            rawType: 'json' as const,
            raw: '',
          },
          auth: {
            type: 'noauth' as const,
            config: {},
          },
          preRequestScript: {
            enabled: false,
            content: '',
          },
          testScript: {
            enabled: false,
            content: '',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        collectionsStore.createRequest(parentId, input.value, defaultRequest);
      }
    },
  });
}

const collectionActionOptions = [
  {
    label: 'Add Folder',
    key: 'add-folder',
    icon: () => h(AddCircleOutline),
  },
  {
    label: 'Add Request',
    key: 'add-request',
    icon: () => h(DocumentTextOutline),
  },
  {
    type: 'divider',
  },
  {
    label: 'Rename',
    key: 'rename',
    icon: () => h(CreateOutline),
  },
  {
    label: 'Duplicate',
    key: 'duplicate',
    icon: () => h(CopyOutline),
  },
  {
    type: 'divider',
  },
  {
    label: 'Export',
    key: 'export',
    icon: () => h(DownloadOutline),
  },
  {
    label: 'Import',
    key: 'import',
    icon: () => h(CloudUploadOutline),
  },
  {
    type: 'divider',
  },
  {
    label: 'Delete',
    key: 'delete',
    icon: () => h(TrashOutline),
  },
];

function handleCollectionAction(key: string) {
  if (!currentCollection.value) return;

  if (key === 'add-folder') {
    handleCreateFolder(currentCollection.value.id);
  } else if (key === 'add-request') {
    handleCreateRequest(currentCollection.value.id);
  } else if (key === 'rename') {
    handleRenameItem(currentCollection.value);
  } else if (key === 'duplicate') {
    handleDuplicateCollection(currentCollection.value);
  } else if (key === 'export') {
    handleExportCollection();
  } else if (key === 'import') {
    handleImportCollection();
  } else if (key === 'delete') {
    dialog.warning({
      title: 'Delete Collection',
      content: `Are you sure you want to delete "${currentCollection.value.name}"? This action cannot be undone.`,
      positiveText: 'Delete',
      negativeText: 'Cancel',
      onPositiveClick: () => {
        collectionsStore.deleteItem(currentCollection.value!.id);
        collectionsStore.setCurrentCollection(null);
      },
    });
  }
}

function handleRenameItem(item: any) {
  dialog.create({
    title: `Rename ${item.type === 'folder' ? 'Folder' : item.type === 'request' ? 'Request' : 'Collection'}`,
    content: () =>
      h('input', {
        type: 'text',
        placeholder: 'New name',
        value: item.name,
        style: 'width: 100%; padding: 8px; margin-top: 8px;',
      }),
    positiveText: 'Save',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value.trim()) {
        collectionsStore.updateItem(item.id, { name: input.value.trim() });
      }
    },
  });
}

function handleDeleteItem(item: any) {
  const itemType = item.type === 'folder' ? 'Folder' : 'Request';
  dialog.warning({
    title: `Delete ${itemType}`,
    content: `Are you sure you want to delete "${item.name}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      collectionsStore.deleteItem(item.id);
    },
  });
}

function handleDuplicateCollection(collection: any) {
  const newCollection = collectionsStore.createCollection(`${collection.name} (Copy)`);
  if (newCollection) {
    collectionsStore.setCurrentCollection(newCollection.id);
  }
}

function handleExportCollection() {
  if (!currentCollection.value) return;
  const exported = collectionsStore.exportCollection(currentCollection.value.id);
  if (exported) {
    const json = JSON.stringify(exported, null, 2);
    navigator.clipboard.writeText(json);
  }
}

function handleImportCollection() {
  dialog.create({
    title: 'Import Collection',
    content: () =>
      h('textarea', {
        placeholder: 'Paste JSON collection data',
        style: 'width: 100%; height: 150px; padding: 8px; margin-top: 8px; font-family: monospace;',
      }),
    positiveText: 'Import',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const textarea = document.querySelector('.n-dialog__content textarea') as HTMLTextAreaElement;
      if (textarea && textarea.value) {
        try {
          const data = JSON.parse(textarea.value);
          collectionsStore.importCollection(data);
        } catch (error) {
          console.error('Invalid JSON:', error);
        }
      }
    },
  });
}
</script>

<style scoped>
.collections-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: #fafafa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  text-align: center;
}

.empty-state p {
  margin-top: 8px;
  font-size: 14px;
}

.hint {
  font-size: 12px;
}

.collection-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #fafafa;
  border-bottom: 1px solid var(--border-color);
}

.collection-info .collection-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.item-count {
  font-size: 12px;
  color: #999;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.no-items {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.no-items p {
  margin-bottom: 16px;
  font-size: 14px;
}

.add-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.items-tree {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
