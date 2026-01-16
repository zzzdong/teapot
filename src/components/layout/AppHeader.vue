<template>
  <div class="app-header">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">🫖</span>
        <span class="logo-text">Teapot</span>
      </div>
    </div>

    <div class="header-center">
      <n-space align="center">
        <n-select
          v-model:value="currentEnvironmentId"
          :options="environmentOptions"
          placeholder="Select Environment"
          size="small"
          style="width: 200px"
          clearable
          @update:value="handleEnvironmentChange"
        />
        <n-button text size="small" @click="handleAddEnvironment">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
        </n-button>
      </n-space>
    </div>

    <div class="header-right">
      <n-space>
        <n-button text @click="handleImport">
          <template #icon>
            <n-icon><ImportIcon /></n-icon>
          </template>
          Import
        </n-button>
        <n-button text @click="handleExport">
          <template #icon>
            <n-icon><ExportIcon /></n-icon>
          </template>
          Export
        </n-button>
        <n-button text @click="handleSettings">
          <template #icon>
            <n-icon><SettingsIcon /></n-icon>
          </template>
        </n-button>
      </n-space>
    </div>

    <SettingsDialog v-model:show="settingsVisible" @close="handleSettingsClose" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NButton, NIcon, NSelect, NSpace, useMessage, useDialog } from 'naive-ui';
import { DownloadOutline as ImportIcon, CloudUploadOutline as ExportIcon, SettingsOutline as SettingsIcon, AddOutline } from '@vicons/ionicons5';
import { useEnvironmentStore } from '@/stores/environment';
import SettingsDialog from '@/components/settings/SettingsDialog.vue';

const dialog = useDialog();
const message = useMessage();
const environmentStore = useEnvironmentStore();

const settingsVisible = ref(false);

const currentEnvironmentId = computed({
  get: () => environmentStore.currentEnvironmentId || null,
  set: (value) => environmentStore.setCurrentEnvironment(value)
});

const environmentOptions = computed(() => {
  const options = environmentStore.environments.map(env => ({
    label: env.name,
    value: env.id
  }));

  // Add option to create new environment
  if (environmentStore.environments.length === 0) {
    options.push({
      label: '+ Create Environment',
      value: '__create__'
    });
  }

  return options;
});

function handleEnvironmentChange(value: string | null) {
  if (value === '__create__') {
    handleAddEnvironment();
  } else {
    environmentStore.setCurrentEnvironment(value);
  }
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
  message.info('Import functionality coming soon');
}

function handleExport() {
  message.info('Export functionality coming soon');
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
  font-size: 24px;
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
