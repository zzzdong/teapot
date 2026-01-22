<template>
  <div class="main-workspace">
    <n-tabs
      v-if="hasTabs"
      type="card"
      addable
      closable
      :value="activeTabId"
      @update:value="handleTabActivate"
      @close="handleTabClose"
      @add="handleCreateTab"
    >
      <template #suffix>
        <n-button
          strong
          secondary
          @click="handleShowCurrentCodeDialog"
          style="margin-right: 12px"
        >
          <template #icon>
            <n-icon>
              <CodeSlashOutline />
            </n-icon>
          </template>
          Code
        </n-button>
      </template>
      <n-tab-pane
        v-for="tab in workspaceStore.tabs"
        :key="tab.id"
        :name="tab.id"
        :tab="getTabLabel(tab)"
      >
        <template #tab>
          <div @contextmenu="(e: MouseEvent) => handleContextMenu(e, tab)">
            {{ getTabLabel(tab) }}
          </div>
        </template>
        <div class="tab-content">
          <div class="request-bar">
            <n-select
              :value="tab.context.request.method"
              :options="methodOptions"
              size="medium"
              style="width: 120px"
              @update:value="(value) => handleMethodChange(value, tab.id)"
            />
            <n-input
              :value="tab.context.request.url"
              placeholder="Enter request URL"
              size="medium"
              clearable
              @update:value="(value) => handleUrlChange(value, tab.id)"
              @keyup.enter="() => handleSend(tab.id)"
            />
            <n-button
              type="primary"
              size="medium"
              :loading="isSending"
              @click="() => handleSend(tab.id)"
            >
              Send
            </n-button>
            <n-button-group>
              <n-button
                type="primary"
                size="medium"
                @click="() => handleSaveClick(tab.id)"
              >
                Save
              </n-button>
              <n-dropdown
                trigger="click"
                :options="saveOptions"
                @select="(key) => handleSaveSelect(key, tab.id)"
                placement="bottom-end"
              >
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
              <RequestBuilder
                :context="tab.context"
                :tab-id="tab.id"
                @update:context="(ctx) => handleContextUpdate(ctx, tab.id)"
              />
            </div>
            <div class="workspace-right">
              <ResponseViewer :context="tab.context" />
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div
      class="empty-workspace"
      v-else
    >
      <div class="empty-state">
        <p>没有打开的请求</p>
        <n-button
          type="primary"
          @click="handleCreateTab"
        >
          <template #icon>
            <n-icon>
              <AddIcon />
            </n-icon>
          </template>
          新建请求
        </n-button>
      </div>
    </div>

    <SaveRequestDialog
      v-model:show="showSaveDialog"
      v-model:isSaveAs="isSaveAsMode"
      @save="handleSaveRequest"
    />

    <div
      v-if="workspaceStore.showConsole"
      class="console-panel-container"
    >
      <ConsolePanel />
    </div>

    <CodeGeneratorDrawer
      v-model:show="showCodeDialog"
      :context="currentCodeContext"
    />

    <!-- 右键菜单 -->
    <n-dropdown
      :show="contextMenuOption.show"
      :options="contextMenuOptions"
      :x="contextMenuOption.x"
      :y="contextMenuOption.y"
      placement="top-start"
      @clickoutside="() => (contextMenuOption.show = false)"
      @select="handleContextMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NTabs, NTabPane, NButton, NIcon, NSelect, NInput, NDropdown, useMessage, useDialog } from 'naive-ui';
import { Add as AddIcon, ArrowDown as ArrowDownIcon, CodeSlashOutline } from '@vicons/ionicons5';
import { useWorkspaceStore } from '@/stores/workspace';
import { useHttpClient } from '@/composables/useHttpClient';
import { useHistoryStore } from '@/stores/history';
import { useCollectionsStore } from '@/stores/collections';
import SaveRequestDialog from '@/components/request/SaveRequestDialog.vue';
import type { HttpMethod, RequestContext, WorkspaceTab, SaveRequestPayload } from '@/types';
import RequestBuilder from '../request/RequestBuilder.vue';
import ResponseViewer from '../response/ResponseViewer.vue';
import ConsolePanel from './ConsolePanel.vue';
import CodeGeneratorDrawer from '../request/CodeGeneratorDrawer.vue';

const dialog = useDialog();
const workspaceStore = useWorkspaceStore();
const message = useMessage();
const historyStore = useHistoryStore();
const collectionsStore = useCollectionsStore();
const { sendRequest } = useHttpClient();

const activeTabId = computed(() => workspaceStore.activeTabId || undefined);

// 添加右键菜单相关变量
const contextMenuOption = ref<{ show: boolean; x: number; y: number; tab?: WorkspaceTab }>({
  show: false,
  x: 0,
  y: 0,
});

const contextMenuOptions = [
  {
    label: '克隆标签页',
    key: 'clone',
  },
  {
    label: '关闭标签页',
    key: 'close',
  },
  {
    label: '关闭其他标签页',
    key: 'closeOthers',
  },
  {
    label: '关闭所有标签页',
    key: 'closeAll',
  },
];

const hasTabs = computed(() => workspaceStore.tabs.length > 0);

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
  { label: 'OPTIONS', value: 'OPTIONS' },
];

const saveOptions = [
  { label: 'Save As...', key: 'saveAs' },
  { label: 'Code', key: 'code' },
];

const showSaveDialog = ref(false);
const currentTabIdForSave = ref<string | null>(null);
const isSaveAsMode = ref(false);

function handleCreateTab() {
  const newTab = workspaceStore.createTab();
  workspaceStore.activateTab(newTab.id);
}

function handleTabActivate(tabId: string) {
  workspaceStore.activateTab(tabId);
}

function handleTabClose(tabId: string) {
  const tab = workspaceStore.tabs.find((t) => t.id === tabId);

  // 检查标签页是否已修改
  if (tab && tab.isModified) {
    // 显示确认对话框
    dialog.warning({
      title: '关闭标签页',
      content: `此标签页 "${tab.name}" 有未保存的更改，确定要关闭吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        workspaceStore.closeTab(tabId);
      },
    });
  } else {
    // 如果没有未保存的更改，直接关闭
    workspaceStore.closeTab(tabId);
  }
}

function getTabLabel(tab: WorkspaceTab) {
  return tab.isModified ? `${tab.name} •` : tab.name;
}

function handleContextMenu(e: MouseEvent, tab: WorkspaceTab) {
  console.log('handleContextMenu', e, tab);
  e.preventDefault();
  contextMenuOption.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    tab: tab,
  };
}

function handleContextMenuSelect(key: string) {
  switch (key) {
    case 'clone':
      cloneTab();
      break;
    case 'close':
      if (contextMenuOption.value.tab) {
        handleTabClose(contextMenuOption.value.tab.id);
      }
      break;
    case 'closeOthers':
      if (contextMenuOption.value.tab) {
        workspaceStore.closeOtherTabs(contextMenuOption.value.tab.id);
        if (contextMenuOption.value.tab.id === activeTabId.value) {
        }
      }
      break;
    case 'closeAll':
      workspaceStore.closeAllTabs();
      break;
  }
  contextMenuOption.value.show = false;
}

function cloneTab() {
  if (!contextMenuOption.value.tab) return;

  const originalTab = contextMenuOption.value.tab;
  // 创建新的请求副本
  const clonedRequest = {
    ...originalTab.context.request,
    id: Date.now().toString(), // 生成新的ID
    name: `${originalTab.context.request.name} (Copy)`, // 添加(Copy)后缀
  };

  // 创建新标签页
  workspaceStore.createTab(clonedRequest);
  message.success('Tab cloned successfully');
}

function handleMethodChange(value: HttpMethod, tabId: string) {
  const tab = workspaceStore.tabs.find((t) => t.id === tabId);
  if (tab?.context?.request) {
    tab.context.request.method = value;
    tab.context.request.updatedAt = Date.now();
    workspaceStore.updateTabContext(tabId, {
      request: tab.context.request,
    });
  }
}

function handleUrlChange(value: string, tabId: string) {
  const tab = workspaceStore.tabs.find((t) => t.id === tabId);
  if (tab?.context?.request) {
    tab.context.request.url = value;
    tab.context.request.updatedAt = Date.now();
    workspaceStore.updateTabContext(tabId, {
      request: tab.context.request,
    });
  }
}

async function handleSend(tabId: string) {
  const tab = workspaceStore.tabs.find((t) => t.id === tabId);
  if (!tab?.context?.request) {
    message.warning('No request context found');
    return;
  }

  const request = tab.context.request;

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
      auth: request.auth,
    };

    // Set request sent timestamp
    tab.context.requestSentAt = Date.now();

    // Pass pre-request script and test script to sendRequest
    const { response, testResult } = await sendRequest(config, request.preRequestScript, request.testScript);

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
  const tab = workspaceStore.tabs.find((t) => t.id === tabId);
  if (!tab?.context.request) return;

  const request = tab.context.request;
  const existingRequest = collectionsStore.findRequestByRequestId(request.id);

  if (existingRequest) {
    // 如果请求已存在于集合中，则更新它
    collectionsStore.updateRequest(request.id, request);
    workspaceStore.markTabAsSaved(tabId);
    message.success('Request updated successfully');
  } else {
    // 如果请求不存在于集合中，则打开保存对话框（普通保存模式）
    isSaveAsMode.value = false;
    currentTabIdForSave.value = tabId;
    showSaveDialog.value = true;
  }
}

function showCodeGenerator(tabId: string) {
  const tab = workspaceStore.tabs.find((t) => t.id === tabId);
  if (tab?.context) {
    currentCodeContext.value = tab.context;
    showCodeDialog.value = true;
  }
}

function handleSaveSelect(key: string, tabId: string) {
  if (key === 'saveAs') {
    // Save As: 无论请求是否存在，都打开保存对话框
    isSaveAsMode.value = true;
    currentTabIdForSave.value = tabId;
    showSaveDialog.value = true;
  } else if (key === 'code') {
    showCodeGenerator(tabId);
  }
}

function handleShowCurrentCodeDialog() {
  if (activeTabId.value) {
    showCodeGenerator(activeTabId.value);
  }
}

function handleContextUpdate(updatedContext: RequestContext, tabId: string) {
  workspaceStore.updateTabContext(tabId, updatedContext);
}

function handleSaveRequest(payload: SaveRequestPayload) {
  if (!currentTabIdForSave.value) return;

  const tab = workspaceStore.tabs.find((t) => t.id === currentTabIdForSave.value!);
  if (!tab?.context?.request) return;

  workspaceStore.saveTab(tab.id);

  // 创建新的请求对象，使用表单中输入的名称和描述
  const newRequest = {
    ...tab.context.request,
    id: Date.now().toString(), // 生成新的ID（Save As应该创建新请求）
    name: payload.name,
    description: payload.description,
  };

  // 保存请求到集合
  collectionsStore.createRequest(payload.folderId || payload.collectionId, newRequest.name, newRequest);

  message.success('Request saved successfully');
  showSaveDialog.value = false;
  currentTabIdForSave.value = null;
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
  height: 100%;
  /* 确保有明确的高度 */
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
