<template>
  <n-modal
    v-model:show="show"
    preset="dialog"
    title="保存请求"
    :show-icon="false"
    :block-scroll="true"
    @after-leave="handleAfterLeave"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="80"
    >
      <n-form-item
        label="请求名称"
        path="name"
      >
        <n-input
          v-model:value="formData.name"
          placeholder="输入请求名称"
        />
      </n-form-item>

      <n-form-item
        label="保存到"
        path="locationId"
      >
        <n-tree-select
          v-model:value="formData.locationId"
          :options="collectionTreeOptions"
          placeholder="选择Collection或文件夹"
          key-field="id"
          label-field="name"
          children-field="children"
          clearable
        />
      </n-form-item>

      <n-form-item
        label="描述"
        path="description"
      >
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="输入描述(可选)"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space>
        <n-button @click="handleCancel">取消</n-button>
        <n-button
          type="primary"
          @click="handleSave"
          >保存</n-button
        >
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NTreeSelect, NButton, NSpace, useMessage } from 'naive-ui';
import { useCollectionsStore } from '@/stores/collections';
import { useWorkspaceStore } from '@/stores/workspace';
import type { SaveRequestPayload } from '@/types/context';

interface Emits {
  (e: 'save', payload: SaveRequestPayload): void;
}
const show = defineModel<boolean>('show', { default: false });
const isSaveAs = defineModel<boolean>('isSaveAs', { default: false });
const emit = defineEmits<Emits>();

const collectionsStore = useCollectionsStore();
const workspaceStore = useWorkspaceStore();
const message = useMessage();

const formRef = ref<any>(null);

const formData = ref({
  name: '',
  locationId: null as string | null,
  description: '',
});

const formRules = {
  name: [
    { required: true, message: '请输入请求名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度应在1-100之间', trigger: 'blur' },
  ],
  locationId: [{ required: true, message: '请选择保存位置', trigger: 'change' }],
};

// Computed
const collectionTreeOptions = computed(() => {
  const items = collectionsStore.allItems;
  // 获取所有集合（顶层）
  const collections = items.filter((item) => item.type === 'collection');

  // 构建树
  return collections
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      children: buildFolderTreeForCollection(collection.id),
    }));
});

// Methods
function buildFolderTreeForCollection(parentId: string): any[] {
  const folders = collectionsStore.allItems
    .filter((item) => item.parentId === parentId && item.type === 'folder')
    .map((folder) => {
      const node: any = {
        id: folder.id,
        name: folder.name,
        children: buildFolderTreeForCollection(folder.id),
      };
      return node;
    });

  return folders;
}

async function handleSave() {
  try {
    await formRef.value?.validate();

    const locationId = formData.value.locationId!;

    // 确定collectionId和folderId
    let collectionId = '';
    let folderId: string | null = null;

    const selectedItem = collectionsStore.findItem(locationId);

    if (!selectedItem) {
      message.error('选择的项目不存在');
      return;
    }

    if (selectedItem.type === 'collection') {
      collectionId = selectedItem.id;
      folderId = null;
    } else if (selectedItem.type === 'folder') {
      // 查找祖先collection
      const ancestorCollectionId = collectionsStore.findAncestorCollection(locationId);
      if (!ancestorCollectionId) {
        message.error('无法找到所属的Collection');
        return;
      }
      collectionId = ancestorCollectionId;
      folderId = selectedItem.id;
    } else {
      // 不应该选择请求
      message.error('请选择Collection或文件夹');
      return;
    }

    // Update request name and description (only for normal save, not Save As)
    if (!isSaveAs.value && workspaceStore.activeTabId) {
      workspaceStore.updateTabName(workspaceStore.activeTabId, formData.value.name, formData.value.description);
    }

    emit('save', { name: formData.value.name, collectionId, folderId, description: formData.value.description });
  } catch (error) {
    console.error('Form validation failed:', error);
  }
}

function handleCancel() {
  show.value = false;
}

function handleAfterLeave() {
  formRef.value?.restoreValidation();
  formData.value = {
    name: '',
    locationId: null,
    description: '',
  };
}

// Watch
watch(show, (newShow) => {
  if (newShow && workspaceStore.activeTabId) {
    const activeTab = workspaceStore.tabs.find((t) => t.id === workspaceStore.activeTabId);
    formData.value.name = activeTab?.context.request.name || '';
    formData.value.description = activeTab?.context.request.description || '';
  }
});
</script>
