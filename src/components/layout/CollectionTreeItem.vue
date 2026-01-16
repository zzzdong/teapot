<template>
  <div class="tree-item">
    <template v-if="item.type === 'folder'">
      <div class="folder-item">
        <div class="item-content" @click="handleToggle(item.id)">
          <n-icon :size="14" :color="'#f0a020'">
            <ChevronDownOutline v-if="isExpanded" />
            <ChevronForwardOutline v-else />
          </n-icon>
          <n-icon :size="16" :color="'#f0a020'">
            <FolderOutline />
          </n-icon>
          <span class="item-name">{{ item.name }}</span>
        </div>
        <n-dropdown
          :options="folderOptions"
          placement="bottom-end"
          trigger="click"
          @select="handleFolderAction"
        >
          <n-button text size="tiny" @click.stop>
            <n-icon><EllipsisVerticalOutline /></n-icon>
          </n-button>
        </n-dropdown>
      </div>
      <div v-if="isExpanded" class="folder-content">
        <CollectionTreeItem
          v-for="child in getChildren(item.id)"
          :key="child.id"
          :item="child"
          :depth="depth + 1"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
          @rename="$emit('rename', $event)"
          @delete="$emit('delete', $event)"
          @add-request="$emit('add-request', $event)"
        />
      </div>
    </template>

    <template v-else-if="item.type === 'request'">
      <div class="request-item">
        <div class="item-content" @click="$emit('select', item)">
          <n-icon :size="16" :color="'#18a058'">
            <DocumentTextOutline />
          </n-icon>
          <span class="method-badge" :class="'method-' + item.request.method">
            {{ item.request.method }}
          </span>
          <span class="item-name">{{ item.name }}</span>
        </div>
        <n-dropdown
          :options="requestOptions"
          placement="bottom-end"
          trigger="click"
          @select="handleRequestAction"
        >
          <n-button text size="tiny" @click.stop>
            <n-icon><EllipsisVerticalOutline /></n-icon>
          </n-button>
        </n-dropdown>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { NIcon, NButton, NDropdown, useDialog } from 'naive-ui';
import {
  ChevronDownOutline,
  ChevronForwardOutline,
  FolderOutline,
  DocumentTextOutline,
  EllipsisVerticalOutline,
  CreateOutline,
  TrashOutline,
  AddCircleOutline
} from '@vicons/ionicons5';
import { useCollectionsStore } from '@/stores/collections';

interface Props {
  item: any;
  depth: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [item: any];
  toggle: [id: string];
  rename: [item: any];
  delete: [item: any];
  'add-request': [parentId: string];
}>();

const dialog = useDialog();
const collectionsStore = useCollectionsStore();

const isExpanded = computed(() => collectionsStore.expandedItems.has(props.item.id));

const folderOptions = [
  {
    label: 'Add Folder',
    key: 'add-folder',
    icon: () => h(AddCircleOutline)
  },
  {
    label: 'Add Request',
    key: 'add-request',
    icon: () => h(DocumentTextOutline)
  },
  {
    type: 'divider'
  },
  {
    label: 'Rename',
    key: 'rename',
    icon: () => h(CreateOutline)
  },
  {
    label: 'Delete',
    key: 'delete',
    icon: () => h(TrashOutline)
  }
];

const requestOptions = [
  {
    label: 'Rename',
    key: 'rename',
    icon: () => h(CreateOutline)
  },
  {
    label: 'Delete',
    key: 'delete',
    icon: () => h(TrashOutline)
  }
];

function getChildren(parentId: string) {
  return collectionsStore.collections.filter(item => item.parentId === parentId);
}

function handleToggle(id: string) {
  collectionsStore.toggleExpanded(id);
}

function handleFolderAction(key: string) {
  if (key === 'rename') {
    emit('rename', props.item);
  } else if (key === 'delete') {
    handleDelete(props.item);
  } else if (key === 'add-folder') {
    handleCreateFolder(props.item.id);
  } else if (key === 'add-request') {
    handleCreateRequest(props.item.id);
  }
}

function handleRequestAction(key: string) {
  if (key === 'rename') {
    emit('rename', props.item);
  } else if (key === 'delete') {
    handleDelete(props.item);
  }
}

function handleDelete(item: any) {
  dialog.warning({
    title: `Delete ${item.type === 'folder' ? 'Folder' : 'Request'}`,
    content: `Are you sure you want to delete this ${item.type}?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      emit('delete', item);
    }
  });
}

function handleCreateFolder(parentId: string) {
  dialog.create({
    title: 'Create Folder',
    content: () => h('input', {
      type: 'text',
      placeholder: 'Folder name',
      style: 'width: 100%; padding: 8px; margin-top: 8px;'
    }),
    positiveText: 'Create',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value) {
        collectionsStore.createFolder(parentId, input.value);
      }
    }
  });
}

function handleCreateRequest(parentId: string) {
  emit('add-request', parentId);
}
</script>

<style scoped>
.tree-item {
  display: flex;
  flex-direction: column;
}

.folder-item,
.request-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.folder-item:hover,
.request-item:hover {
  background-color: rgba(32, 128, 240, 0.1);
}

.item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.folder-content {
  padding-left: 12px;
}

.method-badge {
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 600;
}

.method-GET { color: #18a058; }
.method-POST { color: #2080f0; }
.method-PUT { color: #f0a020; }
.method-DELETE { color: #d03050; }
.method-PATCH { color: #18a058; }
.method-HEAD { color: #8a2be2; }
.method-OPTIONS { color: #8a2be2; }

.item-name {
  font-size: 12px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
