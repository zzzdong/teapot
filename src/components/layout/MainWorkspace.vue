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
        <div class="workspace-content">
          <RequestBuilder v-model:request="tab.request" />
          <ResponseViewer :request-id="tab.request.id" />
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NTabs, NTabPane, NButton, NIcon } from 'naive-ui';
import { Add as AddIcon } from '@vicons/ionicons5';
import { useWorkspace } from '@/composables/useWorkspace';
import RequestBuilder from '../request/RequestBuilder.vue';
import ResponseViewer from '../response/ResponseViewer.vue';

const workspaceStore = useWorkspace();

const hasTabs = computed(() => workspaceStore.tabs.length > 0);
const hasMultipleTabs = computed(() => workspaceStore.tabs.length > 1);

function handleTabClose(name: string) {
  workspaceStore.closeTab(name);
}

function getTabLabel(tab: any) {
  return tab.isModified ? `${tab.name} •` : tab.name;
}

function closeOtherTabs() {
  workspaceStore.closeAllOtherTabs();
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
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
  height: 100%;  /* 确保有明确的高度 */
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
