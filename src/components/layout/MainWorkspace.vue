<template>
  <div class="main-workspace">
    <n-tabs v-if="hasTabs" type="card" addable closable @close="handleTabClose" @add="workspaceStore.createTab()">
      <template #suffix>
        <div class="tabs-actions">
          <n-button v-if="hasMultipleTabs" size="small" @click="closeOtherTabs" title="关闭其他标签页">
            关闭其他
          </n-button>
          <n-button v-if="hasTabs" size="small" @click="workspaceStore.closeAllTabs()" title="关闭所有标签页">
            关闭所有
          </n-button>
        </div>
      </template>

      <n-tab-pane v-for="tab in workspaceStore.tabs" :key="tab.id" :name="tab.id" :tab="getTabLabel(tab)">
        <div class="tab-content">
          <div class="request-bar">
            <n-select :value="tab.context?.request?.method" :options="methodOptions" size="medium" style="width: 120px"
              @update:value="(value) => handleMethodChange(value, tab.id)" />
            <n-input :value="tab.context?.request?.url" placeholder="Enter request URL" size="medium" clearable
              @update:value="(value) => handleUrlChange(value, tab.id)" @keyup.enter="() => handleSend(tab.id)" />
            <n-button type="primary" size="medium" :loading="isSending" @click="() => handleSend(tab.id)">
              Send
            </n-button>
            <n-button-group>
              <n-button type="primary" size="medium" @click="() => handleSaveClick(tab.id)">
                Save
              </n-button>
              <n-dropdown trigger="click" :options="saveOptions" @select="(key) => handleSaveSelect(key, tab.id)" placement="bottom-end">
                <n-button ghost>
                  <n-icon>
                    <ArrowDownIcon />
                  </n-icon>
                </n-button>
              </n-dropdown>
            </n-button-group>
          </div>

          <div class="workspace-content">
            <div class="workspace-left">
              <RequestBuilder v-model:context="tab.context" :tab-id="tab.id" />
            </div>
            <div class="workspace-right">
              <ResponseViewer :context="tab.context" />
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="empty-workspace" v-else>
      <div class="empty-state">
        <p>没有打开的请求</p>
        <n-button type="primary" @click="workspaceStore.createTab()">
          <template #icon>
            <n-icon>
              <AddIcon />
            </n-icon>
          </template>
          新建请求
        </n-button>
      </div>
    </div>

    <div v-if="workspaceStore.showConsole" class="console-panel-container">
      <ConsolePanel />
    </div>

    <CodeGeneratorDrawer :show="showCodeDialog" :context="currentCodeContext" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NTabs, NTabPane, NButton, NIcon, NSelect, NInput, NDropdown, useMessage } from 'naive-ui';
import { Add as AddIcon, ArrowDown as ArrowDownIcon } from '@vicons/ionicons5';
import { useWorkspace } from '@/composables/useWorkspace';
import { useHttpClient } from '@/composables/useHttpClient';
import { useHistoryStore } from '@/stores/history';
import { useCollectionsStore } from '@/stores/collections';
import type { HttpMethod, RequestContext } from '@/types';
import RequestBuilder from '../request/RequestBuilder.vue';
import ResponseViewer from '../response/ResponseViewer.vue';
import ConsolePanel from './ConsolePanel.vue';
import CodeGeneratorDrawer from '../request/CodeGeneratorDrawer.vue';

const workspaceStore = useWorkspace();
const message = useMessage();
const historyStore = useHistoryStore();
const collectionsStore = useCollectionsStore();
const { sendRequest } = useHttpClient();

const hasTabs = computed(() => workspaceStore.tabs.length > 0);
const hasMultipleTabs = computed(() => workspaceStore.tabs.length > 1);

const isSending = ref(false);
const showCodeDialog = ref(false);
const currentCodeContext = ref<RequestContext | null>(null);

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' }
];

const saveOptions = [
  { label: 'Save As...', key: 'saveAs' },
  { label: 'Code', key: 'code' }
];

function handleTabClose(name: string) {
  workspaceStore.closeTab(name);
}

function getTabLabel(tab: any) {
  return tab.isModified ? `${tab.name} •` : tab.name;
}

function closeOtherTabs() {
  workspaceStore.closeAllOtherTabs();
}

function handleMethodChange(value: HttpMethod, tabId: string) {
  const tab = workspaceStore.tabs.find(t => t.id === tabId);
  if (tab?.context?.request) {
    tab.context.request.method = value;
    tab.context.request.updatedAt = Date.now();
    workspaceStore.updateTabContext(tabId, {
      request: tab.context.request
    });
  }
}

function handleUrlChange(value: string, tabId: string) {
  const tab = workspaceStore.tabs.find(t => t.id === tabId);
  if (tab?.context?.request) {
    tab.context.request.url = value;
    tab.context.request.updatedAt = Date.now();
    workspaceStore.updateTabContext(tabId, {
      request: tab.context.request
    });
  }
}

async function handleSend(tabId: string) {
  const tab = workspaceStore.tabs.find(t => t.id === tabId);
  if (!tab?.context?.request) {
    message.warning('No request context found');
    return;
  }

  const request = tab?.context?.request;
  
  if (!request?.url) {
    message.warning('Please enter a URL');
    return;
  }

  try {
    isSending.value = true;

    const config = {
      id: request.id,
      method: request.method,
      url: request.url,
      params: request.params,
      headers: request.headers,
      body: request.body,
      auth: request.auth
    };

    // Set request sent timestamp
    tab.context.requestSentAt = Date.now();

    // Pass pre-request script and test script to sendRequest
    const { response, testResult } = await sendRequest(
      config,
      request.preRequestScript,
      request.testScript
    );

    // Update context with response and test results
    tab.context.response = response;
    tab.context.testResult = testResult;
    tab.context.responseReceivedAt = Date.now();

    // Add to history using context
    historyStore.addToHistory(tab.context);

    message.success('Request sent successfully');
  } catch (error: any) {
    console.error('Request error:', error);
    const errorMessage = error?.message || String(error);
    message.error(`Request failed: ${errorMessage}`);
  } finally {
    isSending.value = false;
  }
}

function handleSaveClick(tabId: string) {
  const tab = workspaceStore.tabs.find(t => t.id === tabId);
  const request = tab?.context?.request;
  
  if (!request) return;

  const existingRequest = collectionsStore.findRequestByRequestId(request.id);

  if (existingRequest) {
    // 直接更新现有请求
    collectionsStore.updateRequest(request.id, request);
    workspaceStore.markTabAsSaved(tabId);
    message.success('Request updated successfully');
  } else {
    // 这里可以触发一个保存对话框，但为了简化，我们暂时不实现
    message.info('Save As functionality not implemented in this context');
  }
}

function handleSaveSelect(key: string, tabId: string) {
  if (key === 'saveAs') {
    message.info('Save As functionality not implemented in this context');
  } else if (key === 'code') {
    const tab = workspaceStore.tabs.find(t => t.id === tabId);
    if (tab?.context) {
      currentCodeContext.value = tab.context;
      showCodeDialog.value = true;
    }
  }
}
</script>

<style scoped>
.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

.request-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: #fafafa;
}

:deep(.n-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.n-tabs-nav-wrapper) {
  flex-shrink: 0;
}

:deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.n-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding-right: 16px;
}

.new-tab-btn {
  margin-right: 4px;
}

.workspace-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 100%;  /* 确保有明确的高度 */
}

.workspace-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.workspace-left > * {
  flex: 1;
}

.workspace-right {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.workspace-right > * {
  flex: 1;
}

.console-panel-container {
  height: 300px;
  border-top: 1px solid var(--border-color);
  overflow: hidden;
}

.empty-workspace {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.empty-state {
  text-align: center;
  color: #999;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 14px;
}
</style>