<template>
  <div class="app-header">
    <div class="header-left">
      <div class="logo">
        <img src="@/assets/teapot-icon.svg" alt="Teapot" class="logo-icon" />
        <span class="logo-text">Teapot</span>
      </div>
    </div>

    <div class="header-center">
      <n-space align="center">
        <n-select v-model:value="currentEnvironmentId" :options="environmentOptions" placeholder="Select Environment"
          size="small" style="width: 200px" clearable @update:value="handleEnvironmentChange">
          <template #action>
            <n-button text size="small" @click="handleAddEnvironment">
              <template #icon>
                <n-icon>
                  <AddOutline />
                </n-icon>
              </template>
              Add Environment
            </n-button>
          </template>
        </n-select>
        <n-button quaternary circle size="small" @click="environmentDrawerVisible = true">
          <template #icon>
            <n-icon>
              <OptionsOutline />
            </n-icon>
          </template>
        </n-button>
      </n-space>
    </div>

    <div class="header-right">
      <n-space align="center">
        <n-button text @click="handleImport">
          <template #icon>
            <n-icon>
              <ImportIcon />
            </n-icon>
          </template>
          Import
        </n-button>
        <n-button text @click="handleExport">
          <template #icon>
            <n-icon>
              <ExportIcon />
            </n-icon>
          </template>
          Export
        </n-button>
        <n-button quaternary circle size="small" @click="handleSettings">
          <template #icon>
            <n-icon>
              <SettingsIcon />
            </n-icon>
          </template>
        </n-button>
      </n-space>
    </div>

    <SettingsDialog v-model:show="settingsVisible" @close="handleSettingsClose" />

    <n-drawer v-model:show="environmentDrawerVisible" title="Environment Editor" placement="right" :width="400">
      <EnvironmentPanel />
    </n-drawer>

    <ImportModal v-model:modelValue="importModalVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NButton, NIcon, NSelect, NSpace, useMessage, useDialog, NDrawer } from 'naive-ui';
import { DownloadOutline as ImportIcon, CloudUploadOutline as ExportIcon, SettingsOutline as SettingsIcon, AddOutline, OptionsOutline } from '@vicons/ionicons5';
import { useEnvironmentStore } from '@/stores/environment';
import { useCollectionsStore } from '@/stores/collections';
import * as tauriApi from '@/api/tauri-api';
import SettingsDialog from '@/components/settings/SettingsDialog.vue';
import EnvironmentPanel from './EnvironmentPanel.vue';
import ImportModal from '@/components/common/ImportModal.vue';


const dialog = useDialog();
const message = useMessage();
const environmentStore = useEnvironmentStore();
const collectionStore = useCollectionsStore();

const settingsVisible = ref(false);
const environmentDrawerVisible = ref(false);
const importModalVisible = ref(false);

const currentEnvironmentId = computed({
  get: () => environmentStore.currentEnvironmentId || null,
  set: (value) => environmentStore.setCurrentEnvironment(value)
});

const environmentOptions = computed(() => {
  const options = environmentStore.environments.map(env => ({
    label: env.name,
    value: env.id
  }));

  return options;
});

function handleEnvironmentChange(value: string | null) {
  environmentStore.setCurrentEnvironment(value);
}

function handleAddEnvironment() {
  dialog.create({
    title: 'Create Environment',
    content: () => h('input', {
      type: 'text',
      placeholder: 'Environment name',
      style: 'width: 100%; padding: 8px; margin-top: 8px;'
    }),
    positiveText: 'Create',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value) {
        const newEnv = environmentStore.createEnvironment(input.value);
        environmentStore.setCurrentEnvironment(newEnv.id);
      }
    }
  });
}

function handleImport() {
  importModalVisible.value = true;
}

async function handleExport() {
  try {
    const defaultName = `teapot-export-${Date.now()}.json`;
    const filePath = await tauriApi.file.save(defaultName);

    if (!filePath) return;

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      environments: environmentStore.environments,
      collections: collectionStore.collections
    };

    await tauriApi.file.writeText(filePath, JSON.stringify(exportData, null, 2));
    message.success('Export successful');
  } catch (error) {
    message.error('Failed to export');
    console.error('Export error:', error);
  }
}

function handleSettings() {
  settingsVisible.value = true;
}

function handleSettingsClose() {
  settingsVisible.value = false;
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 24px;
  height: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.header-center {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
