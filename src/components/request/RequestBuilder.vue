<template>
  <div class="request-builder">
    <div class="request-bar">
      <n-select v-model:value="request.method" :options="methodOptions" size="medium" style="width: 120px"
        @update:value="handleMethodChange" />
      <n-input v-model:value="request.url" placeholder="Enter request URL" size="medium" clearable
        @keyup.enter="handleSend" />
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
        <ParamsTab v-model:params="request.params" />
      </n-tab-pane>
      <n-tab-pane name="headers" tab="Headers">
        <HeadersTab v-model:headers="request.headers" />
      </n-tab-pane>
      <n-tab-pane name="body" tab="Body">
        <BodyTab v-model:body="request.body" />
      </n-tab-pane>
      <n-tab-pane name="auth" tab="Authorization">
        <AuthTab v-model:auth="request.auth" />
      </n-tab-pane>
      <n-tab-pane name="pre-request" tab="Pre-request Script">
        <PreRequestScriptTab v-model:script="request.preRequestScript" />
      </n-tab-pane>
      <n-tab-pane name="tests" tab="Tests">
        <TestsTab v-model:script="request.testScript" />
      </n-tab-pane>
    </n-tabs>

    <SaveRequestDialog v-model:show="showSaveDialog" @save="handleSaveSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NInput, NSelect, NTabs, NTabPane, useMessage, NDropdown, NIcon } from 'naive-ui';
import { useHistoryStore } from '@/stores/history';
import { useResponseStore } from '@/stores/response';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCollectionsStore } from '@/stores/collections';
import { useHttpClient } from '@/composables/useHttpClient';
import type { Request, HttpMethod, RequestParam, RequestHeader, RequestBody, AuthConfig, PreRequestScript, TestScript } from '@/types';
import { ArrowDown as ArrowDownIcon } from '@vicons/ionicons5';
import ParamsTab from './ParamsTab.vue';
import AuthTab from './AuthTab.vue';
import HeadersTab from './HeadersTab.vue';
import BodyTab from './BodyTab.vue';
import PreRequestScriptTab from './PreRequestScriptTab.vue';
import TestsTab from './TestsTab.vue';
import SaveRequestDialog from './SaveRequestDialog.vue';

const request = defineModel<Request>('request', { required: true });

const message = useMessage();
const historyStore = useHistoryStore();
const responseStore = useResponseStore();
const workspaceStore = useWorkspaceStore();
const collectionsStore = useCollectionsStore();
const { sendRequest } = useHttpClient();

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

    // Pass pre-request script and test script to sendRequest
    const { response, testResult } = await sendRequest(
      config,
      request.value.preRequestScript,
      request.value.testScript
    );

    responseStore.setResponse(response);
    historyStore.addToHistory(request.value, response);

    // Store test result for display
    if (testResult) {
      // Store test result in response store or emit event
      console.log('Test result:', testResult);
      responseStore.setTestResult(testResult);
    }

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
    workspaceStore.markTabAsSaved(requestId);
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

  workspaceStore.markTabAsSaved(request.value.id);

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
