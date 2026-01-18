<template>
  <div class="request-builder">
    <div class="request-bar">
      <n-select :value="request.method" :options="methodOptions" size="medium" style="width: 120px"
        @update:value="handleMethodChange" />
      <n-input :value="request.url" placeholder="Enter request URL" size="medium" clearable
        @update:value="handleUrlChange" @keyup.enter="handleSend" />
      <n-button type="primary" size="medium" :loading="isSending" @click="handleSend">
        Send
      </n-button>
      <n-button-group>
        <n-button type="primary" size="medium" @click="handleSaveClick">
          Save
        </n-button>
        <n-dropdown trigger="click" :options="saveOptions" @select="handleSaveSelect" placement="bottom-end">
          <n-button ghost>
            <n-icon>
              <ArrowDownIcon />
            </n-icon>
          </n-button>
        </n-dropdown>
      </n-button-group>
    </div>

    <n-tabs class="tab-container" v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="params" tab="Params">
        <ParamsTab :params="request.params" @update:params="handleParamsUpdate" />
      </n-tab-pane>
      <n-tab-pane name="headers" tab="Headers">
        <HeadersTab :headers="request.headers" @update:headers="handleHeadersUpdate" />
      </n-tab-pane>
      <n-tab-pane name="body" tab="Body">
        <BodyTab v-model:body="request.body" />
      </n-tab-pane>
      <n-tab-pane name="auth" tab="Authorization">
        <AuthTab :auth="request.auth" @update:auth="handleAuthUpdate" />
      </n-tab-pane>
      <n-tab-pane name="pre-request" tab="Pre-request Script">
        <PreRequestScriptTab :script="request.preRequestScript" @update="handlePreRequestScriptUpdate" />
      </n-tab-pane>
      <n-tab-pane name="tests" tab="Tests">
        <TestsTab :script="request.testScript" @update="handleTestScriptUpdate" />
      </n-tab-pane>
    </n-tabs>

    <SaveRequestDialog v-model:show="showSaveDialog" @save="handleSaveSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NButton, NInput, NSelect, NTabs, NTabPane, useMessage, NDropdown, NIcon } from 'naive-ui';
import { useHistoryStore } from '@/stores/history';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCollectionsStore } from '@/stores/collections';
import { useHttpClient } from '@/composables/useHttpClient';
import type { RequestContext, HttpMethod, TestScript, PreRequestScript, RequestParam, RequestHeader, AuthConfig } from '@/types';
import { ArrowDown as ArrowDownIcon } from '@vicons/ionicons5';
import ParamsTab from './ParamsTab.vue';
import AuthTab from './AuthTab.vue';
import HeadersTab from './HeadersTab.vue';
import BodyTab from './BodyTab.vue';
import PreRequestScriptTab from './PreRequestScriptTab.vue';
import TestsTab from './TestsTab.vue';
import SaveRequestDialog from './SaveRequestDialog.vue';

const props = defineProps<{
  tabId: string;
}>();

const context = defineModel<RequestContext>('context', { required: true });
const request = computed(() => context.value?.request);

const message = useMessage();
const historyStore = useHistoryStore();
const workspaceStore = useWorkspaceStore();
const collectionsStore = useCollectionsStore();
const { sendRequest } = useHttpClient();

// Watch for body changes and persist to store
watch(() => request.value?.body, (newBody) => {
  if (newBody && props.tabId) {
    context.value.request.updatedAt = Date.now();
    workspaceStore.updateTabContext(props.tabId, {
      request: context.value.request
    });
  }
}, { deep: true });

function handleTestScriptUpdate(newTestScript: TestScript) {
  if (context.value && context.value.request) {
    context.value.request.testScript = newTestScript;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handlePreRequestScriptUpdate(newPreRequestScript: PreRequestScript) {
  if (context.value && context.value.request) {
    context.value.request.preRequestScript = newPreRequestScript;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handleParamsUpdate(newParams: RequestParam[]) {
  if (context.value && context.value.request) {
    context.value.request.params = newParams;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handleHeadersUpdate(newHeaders: RequestHeader[]) {
  if (context.value && context.value.request) {
    context.value.request.headers = newHeaders;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handleAuthUpdate(newAuth: AuthConfig) {
  if (context.value && context.value.request) {
    context.value.request.auth = newAuth;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

const activeTab = ref('params');
const showSaveDialog = ref(false);

// 保存选项（仅Save As）
const saveOptions = [
  { label: 'Save As...', key: 'saveAs' }
];

const isSending = ref(false);

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' }
];

function handleMethodChange(value: HttpMethod) {
  if (request.value) {
    request.value.method = value;
    request.value.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: request.value
      });
    }
  }
}

function handleUrlChange(value: string) {
  if (request.value) {
    request.value.url = value;
    request.value.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: request.value
      });
    }
  }
}

async function handleSend() {
  if (!request.value?.url) {
    message.warning('Please enter a URL');
    return;
  }

  try {
    isSending.value = true;

    const config = {
      id: request.value.id,
      method: request.value.method,
      url: request.value.url,
      params: request.value.params,
      headers: request.value.headers,
      body: request.value.body,
      auth: request.value.auth
    };

    // Set request sent timestamp
    context.value.requestSentAt = Date.now();

    // Pass pre-request script and test script to sendRequest
    const { response, testResult } = await sendRequest(
      config,
      request.value.preRequestScript,
      request.value.testScript
    );

    // Update context with response and test results
    context.value.response = response;
    context.value.testResult = testResult;
    context.value.responseReceivedAt = Date.now();

    // Add to history using context
    historyStore.addToHistory(context.value);

    message.success('Request sent successfully');
  } catch (error: any) {
    console.error('Request error:', error);
    const errorMessage = error?.message || String(error);
    message.error(`Request failed: ${errorMessage}`);
  } finally {
    isSending.value = false;
  }
}

function handleSaveClick() {
  const requestId = request.value?.id;
  if (!requestId || !request.value) return;

  const existingRequest = collectionsStore.findRequestByRequestId(requestId);

  if (existingRequest) {
    // 直接更新现有请求
    collectionsStore.updateRequest(requestId, request.value);
    workspaceStore.markTabAsSaved(props.tabId);
    message.success('Request updated successfully');
  } else {
    // 打开保存对话框
    showSaveDialog.value = true;
  }
}

function handleSaveSelect(key: string) {
  if (key === 'saveAs') {
    showSaveDialog.value = true;
  }
}

function handleSaveSuccess(collectionId: string, folderId: string | null) {
  if (!request.value) return;

  collectionsStore.createRequest(
    folderId || collectionId,
    request.value.name,
    request.value
  );

  workspaceStore.markTabAsSaved(props.tabId);

  message.success('Request saved successfully');
  showSaveDialog.value = false;
}
</script>

<style scoped>
.request-builder {
  display: flex;
  flex-direction: column;
  flex: 1;
  border-bottom: 1px solid var(--border-color);
  min-height: 0;
}

.request-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  padding: 0 16px;
  height: 100%;
}

:deep(.n-tabs-pane-wrapper) {
  overflow: auto;
  flex: 1;
  min-height: 0;
}

:deep(.n-tab-pane) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
