<template>
  <div class="environment-panel">
    <div class="panel-header">
      <n-select
        v-model:value="selectedScope"
        :options="scopeOptions"
        size="small"
        style="width: 140px"
        @update:value="handleScopeChange"
      />
      <div class="header-actions">
        <n-button text size="small" @click="handleAddVariable" :disabled="!canAddVariable">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          Add
        </n-button>
        <n-dropdown
          :options="moreOptions"
          placement="bottom-start"
          trigger="click"
          @select="handleMoreAction"
        >
          <n-button text size="small">
            <template #icon>
              <n-icon><EllipsisVerticalOutline /></n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </div>

    <div class="env-content">
      <!-- Global Variables -->
      <div v-if="selectedScope === 'global'" class="variables-section">
        <div class="section-header">
          <span>Global Variables</span>
          <span class="var-count">{{ globalVariables.length }}</span>
        </div>
        <div v-if="globalVariables.length === 0" class="empty-state">
          <p>No global variables</p>
        </div>
        <div v-else class="variable-list">
          <div
            v-for="(variable, index) in globalVariables"
            :key="index"
            class="variable-row"
            :class="{ 'disabled': !variable.enabled }"
          >
            <div class="var-checkbox">
              <input
                type="checkbox"
                :checked="variable.enabled"
                @change="toggleGlobalVariable(index, $event)"
              />
            </div>
            <input
              v-model="variable.key"
              class="var-key"
              placeholder="Key"
              @input="updateGlobalVariable(index, variable)"
            />
            <div class="var-value-wrapper">
              <input
                :type="showSecrets[variable.key] ? 'text' : variable.secret ? 'password' : 'text'"
                v-model="variable.value"
                class="var-value"
                placeholder="Value"
                @input="updateGlobalVariable(index, variable)"
              />
              <n-button
                v-if="variable.secret"
                text
                size="tiny"
                class="reveal-btn"
                @click="toggleSecret(variable.key)"
              >
                <template #icon>
                  <n-icon><component :is="showSecrets[variable.key] ? EyeOff : Eye" /></n-icon>
                </template>
              </n-button>
            </div>
            <div class="var-actions">
              <n-dropdown
                :options="getVarActionOptions(variable, 'global', index)"
                placement="bottom-start"
                trigger="click"
                @select="(key) => handleVarAction(key, 'global', index)"
              >
                <n-button text size="tiny">
                  <template #icon>
                    <n-icon><EllipsisHorizontalOutline /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- Environment Variables -->
      <div v-if="selectedScope === 'environment'" class="variables-section">
        <div v-if="!currentEnvironment" class="no-env">
          <n-icon :size="48" :color="'#ccc'"><CloudOutline /></n-icon>
          <p>No environment selected</p>
          <n-button type="primary" size="small" @click="handleCreateEnvironment">
            Create Environment
          </n-button>
        </div>
        <div v-else>
          <div class="env-info">
            <div class="env-name">{{ currentEnvironment.name }}</div>
            <div class="env-actions">
              <n-button text size="tiny" @click="handleRenameEnvironment">
                <template #icon>
                  <n-icon><PencilOutline /></n-icon>
                </template>
              </n-button>
              <n-button text size="tiny" @click="handleDuplicateEnvironment">
                <template #icon>
                  <n-icon><CopyOutline /></n-icon>
                </template>
              </n-button>
              <n-button text size="tiny" type="error" @click="handleDeleteEnvironment">
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
              </n-button>
            </div>
          </div>
          <div class="section-header">
            <span>Variables</span>
            <span class="var-count">{{ environmentVariables.length }}</span>
          </div>
          <div v-if="environmentVariables.length === 0" class="empty-state">
            <p>No variables</p>
          </div>
          <div v-else class="variable-list">
            <div
              v-for="(variable, index) in environmentVariables"
              :key="index"
              class="variable-row"
              :class="{ 'disabled': !variable.enabled }"
            >
              <div class="var-checkbox">
                <input
                  type="checkbox"
                  :checked="variable.enabled"
                  @change="toggleEnvVariable(index, $event)"
                />
              </div>
              <input
                v-model="variable.key"
                class="var-key"
                placeholder="Key"
                @input="updateEnvVariable(index, variable)"
              />
              <div class="var-value-wrapper">
                <input
                  :type="showSecrets[variable.key] ? 'text' : variable.secret ? 'password' : 'text'"
                  v-model="variable.value"
                  class="var-value"
                  placeholder="Value"
                  @input="updateEnvVariable(index, variable)"
                />
                <n-button
                  v-if="variable.secret"
                  text
                  size="tiny"
                  class="reveal-btn"
                  @click="toggleSecret(variable.key)"
                >
                  <template #icon>
                    <n-icon><component :is="showSecrets[variable.key] ? EyeOff : Eye" /></n-icon>
                  </template>
                </n-button>
              </div>
              <div class="var-actions">
                <n-dropdown
                  :options="getVarActionOptions(variable, 'environment', index)"
                  placement="bottom-start"
                  trigger="click"
                  @select="(key) => handleVarAction(key, 'environment', index)"
                >
                  <n-button text size="tiny">
                    <template #icon>
                      <n-icon><EllipsisHorizontalOutline /></n-icon>
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic Variables -->
      <div v-if="selectedScope === 'dynamic'" class="dynamic-section">
        <div class="section-title">Dynamic Variables</div>
        <div class="section-desc">Auto-generated values that change on each request</div>
        <div class="dynamic-list">
          <div
            v-for="variable in dynamicVariables"
            :key="variable.key"
            class="dynamic-item"
          >
            <div class="variable-key">{{ variable.key }}</div>
            <div class="variable-desc">{{ variable.description }}</div>
            <div class="variable-preview">{{ variable.preview }}</div>
            <n-button text size="tiny" @click="handleCopyVariable(variable.key)">
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NButton, NIcon, NSelect, NDropdown, useDialog, useMessage } from 'naive-ui';
import {
  AddOutline,
  DownloadOutline,
  CloudUploadOutline,
  CopyOutline,
  TrashOutline,
  Eye,
  EyeOff,
  EllipsisVerticalOutline,
  EllipsisHorizontalOutline,
  KeyOutline,
  LockClosedOutline,
  PencilOutline,
  CloudOutline
} from '@vicons/ionicons5';
import { useEnvironmentStore } from '@/stores/environment';
import type { EnvironmentVariable } from '@/types/environment';

const dialog = useDialog();
const message = useMessage();
const environmentStore = useEnvironmentStore();

const selectedScope = ref<'global' | 'environment' | 'dynamic'>('environment');
const showSecrets = ref<Record<string, boolean>>({});

const scopeOptions = [
  { label: 'Environment', value: 'environment' },
  { label: 'Global', value: 'global' },
  { label: 'Dynamic', value: 'dynamic' }
];

const canAddVariable = computed(() => {
  if (selectedScope.value === 'global') return true;
  if (selectedScope.value === 'environment') return currentEnvironment.value !== null;
  return false;
});

const currentEnvironment = computed(() => environmentStore.currentEnvironment);
const globalVariables = computed(() => environmentStore.globalVariables);
const environmentVariables = computed(() => currentEnvironment.value?.variables || []);

const dynamicVariables = computed(() => [
  { key: '{{$timestamp}}', description: 'Current timestamp in milliseconds', preview: String(Date.now()) },
  { key: '{{$randomInt}}', description: 'Random integer between 0-999', preview: String(Math.floor(Math.random() * 1000)) },
  { key: '{{$guid}}', description: 'Random GUID/UUID', preview: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' },
  { key: '{{$randomUserName}}', description: 'Random username', preview: 'user_x7k2m' },
  { key: '{{$randomEmail}}', description: 'Random email address', preview: 'user_x7k2m@example.com' },
  { key: '{{$randomBoolean}}', description: 'Random true/false', preview: 'true' },
  { key: '{{$randomDate}}', description: 'Random ISO date', preview: new Date().toISOString().split('T')[0] },
  { key: '{{$randomTime}}', description: 'Current time', preview: new Date().toTimeString().split(' ')[0] }
]);

const moreOptions = computed(() => {
  const options = [];

  if (selectedScope.value === 'global' || selectedScope.value === 'environment') {
    options.push({
      label: 'Import',
      key: 'import',
      icon: () => h(NIcon, null, { default: () => h(CloudUploadOutline) })
    });
    options.push({
      label: 'Export',
      key: 'export',
      icon: () => h(NIcon, null, { default: () => h(DownloadOutline) })
    });
    options.push({ type: 'divider' });
    options.push({
      label: 'Clear All',
      key: 'clear',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
    });
  }

  return options;
});

function handleScopeChange() {
  showSecrets.value = {};
}

function handleAddVariable() {
  if (selectedScope.value === 'global') {
    environmentStore.addGlobalVariable({ key: '', value: '', enabled: true, secret: false });
  } else if (selectedScope.value === 'environment' && currentEnvironment.value) {
    environmentStore.addVariableToEnvironment(currentEnvironment.value.id, { key: '', value: '', enabled: true, secret: false });
  }
}

function toggleGlobalVariable(index: number, e: Event) {
  const enabled = (e.target as HTMLInputElement).checked;
  environmentStore.updateGlobalVariable(index, { ...globalVariables.value[index], enabled });
}

function toggleEnvVariable(index: number, e: Event) {
  const enabled = (e.target as HTMLInputElement).checked;
  environmentStore.updateVariableInEnvironment(currentEnvironment.value!.id, index, { ...environmentVariables.value[index], enabled });
}

function updateGlobalVariable(index: number, variable: EnvironmentVariable) {
  environmentStore.updateGlobalVariable(index, variable);
}

function updateEnvVariable(index: number, variable: EnvironmentVariable) {
  environmentStore.updateVariableInEnvironment(currentEnvironment.value!.id, index, variable);
}

function toggleSecret(key: string) {
  showSecrets.value[key] = !showSecrets.value[key];
}

function getVarActionOptions(variable: EnvironmentVariable, scope: string, index: number) {
  return [
    {
      label: 'Mark as Secret',
      key: 'toggle-secret',
      icon: () => h(NIcon, null, { default: () => h(variable.secret ? LockClosedOutline : KeyOutline) })
    },
    {
      label: 'Duplicate',
      key: 'duplicate',
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
    },
    { type: 'divider' },
    {
      label: 'Delete',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      props: { style: 'color: #d03050;' }
    }
  ];
}

function handleVarAction(key: string, scope: string, index: number) {
  if (scope === 'global') {
    const variable = globalVariables.value[index];
    if (key === 'toggle-secret') {
      environmentStore.updateGlobalVariable(index, { ...variable, secret: !variable.secret });
    } else if (key === 'duplicate') {
      environmentStore.addGlobalVariable({ ...variable, key: `${variable.key}_copy` });
    } else if (key === 'delete') {
      environmentStore.deleteGlobalVariable(index);
    }
  } else if (scope === 'environment') {
    const variable = environmentVariables.value[index];
    if (key === 'toggle-secret') {
      environmentStore.updateVariableInEnvironment(currentEnvironment.value!.id, index, { ...variable, secret: !variable.secret });
    } else if (key === 'duplicate') {
      environmentStore.addVariableToEnvironment(currentEnvironment.value!.id, { ...variable, key: `${variable.key}_copy` });
    } else if (key === 'delete') {
      environmentStore.deleteVariableFromEnvironment(currentEnvironment.value!.id, index);
    }
  }
}

function handleMoreAction(key: string) {
  if (key === 'import') {
    handleImportVariables();
  } else if (key === 'export') {
    handleExportVariables();
  } else if (key === 'clear') {
    handleClearAll();
  }
}

function handleCreateEnvironment() {
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
        message.success(`Environment "${input.value}" created`);
      }
    }
  });
}

function handleRenameEnvironment() {
  dialog.create({
    title: 'Rename Environment',
    content: () => h('input', {
      type: 'text',
      placeholder: 'New name',
      value: currentEnvironment.value?.name || '',
      style: 'width: 100%; padding: 8px; margin-top: 8px;'
    }),
    positiveText: 'Rename',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const input = document.querySelector('.n-dialog__content input') as HTMLInputElement;
      if (input && input.value && currentEnvironment.value) {
        environmentStore.updateEnvironment(currentEnvironment.value.id, { name: input.value });
        message.success(`Environment renamed to "${input.value}"`);
      }
    }
  });
}

function handleDuplicateEnvironment() {
  if (currentEnvironment.value) {
    const newEnv = environmentStore.createEnvironment(`${currentEnvironment.value.name} (Copy)`);
    environmentStore.addVariableToEnvironment(newEnv.id, ...currentEnvironment.value.variables.map(v => ({ ...v })));
    message.success(`Environment duplicated`);
  }
}

function handleDeleteEnvironment() {
  dialog.warning({
    title: 'Delete Environment',
    content: `Are you sure you want to delete "${currentEnvironment.value?.name}"? This action cannot be undone.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      if (currentEnvironment.value) {
        environmentStore.deleteEnvironment(currentEnvironment.value.id);
        message.success(`Environment deleted`);
      }
    }
  });
}

async function handleCopyVariable(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    message.success('Copied to clipboard');
  } catch (error) {
    message.error('Failed to copy');
  }
}

function handleImportVariables() {
  const scope = selectedScope.value === 'global' ? 'global' : 'environment';
  dialog.create({
    title: `Import ${scope === 'global' ? 'Global' : 'Environment'} Variables`,
    content: () => h('textarea', {
      placeholder: 'Paste JSON variables (e.g., {"key": "value"})',
      style: 'width: 100%; height: 150px; padding: 8px; margin-top: 8px; font-family: monospace;'
    }),
    positiveText: 'Import',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const textarea = document.querySelector('.n-dialog__content textarea') as HTMLTextAreaElement;
      if (textarea && textarea.value) {
        try {
          const variables = JSON.parse(textarea.value);
          if (typeof variables === 'object' && variables !== null) {
            environmentStore.importVariables(variables, scope);
            message.success(`Imported ${Object.keys(variables).length} variables`);
          } else {
            message.error('Invalid format: expected JSON object');
          }
        } catch (error) {
          message.error('Invalid JSON format');
        }
      }
    }
  });
}

function handleExportVariables() {
  const scope = selectedScope.value === 'global' ? 'global' : 'environment';
  const variables = environmentStore.exportVariables(scope);
  const json = JSON.stringify(variables, null, 2);
  navigator.clipboard.writeText(json);
  message.success(`Exported ${Object.keys(variables).length} variables to clipboard`);
}

function handleClearAll() {
  dialog.warning({
    title: 'Clear All Variables',
    content: `Are you sure you want to clear all ${selectedScope.value === 'global' ? 'global' : 'environment'} variables?`,
    positiveText: 'Clear',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      if (selectedScope.value === 'global') {
        while (environmentStore.globalVariables.length > 0) {
          environmentStore.deleteGlobalVariable(0);
        }
      } else if (selectedScope.value === 'environment' && currentEnvironment.value) {
        while (currentEnvironment.value.variables.length > 0) {
          environmentStore.deleteVariableFromEnvironment(currentEnvironment.value.id, 0);
        }
      }
      message.success('All variables cleared');
    }
  });
}
</script>

<style scoped>
.environment-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: #fafafa;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.env-content {
  flex: 1;
  overflow-y: auto;
}

.variables-section {
  padding: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.var-count {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 0;
}

.no-env {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.no-env p {
  margin: 16px 0;
  font-size: 14px;
}

.env-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 4px;
  margin-bottom: 12px;
}

.env-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.env-actions {
  display: flex;
  gap: 4px;
}

.variable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.variable-row:hover {
  border-color: #1890ff;
  background-color: #fff;
}

.variable-row.disabled {
  opacity: 0.5;
}

.var-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.var-key {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid transparent;
  background: transparent;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  border-radius: 3px;
  transition: all 0.2s;
}

.var-key:focus {
  outline: none;
  border-color: #1890ff;
  background-color: #fff;
}

.var-value-wrapper {
  flex: 1.5;
  display: flex;
  align-items: center;
  gap: 4px;
}

.var-value {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid transparent;
  background: transparent;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  border-radius: 3px;
  transition: all 0.2s;
}

.var-value:focus {
  outline: none;
  border-color: #1890ff;
  background-color: #fff;
}

.reveal-btn {
  flex-shrink: 0;
}

.var-actions {
  flex-shrink: 0;
}

.dynamic-section {
  padding: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.section-desc {
  font-size: 11px;
  color: #999;
  margin-bottom: 12px;
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dynamic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.dynamic-item:hover {
  border-color: #1890ff;
  background-color: #fff;
}

.dynamic-item .variable-key {
  flex: 0 0 140px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #2080f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dynamic-item .variable-desc {
  flex: 1;
  font-size: 12px;
  color: #666;
}

.dynamic-item .variable-preview {
  flex: 0 0 100px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #999;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
