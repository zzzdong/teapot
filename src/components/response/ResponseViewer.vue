<template>
  <div class="response-viewer">
    <div v-if="!hasResponse" class="no-response">
      <n-icon size="64" :color="'#ccc'">
        <DocumentTextOutline />
      </n-icon>
      <p>Send a request to see the response</p>
    </div>

    <div v-else class="response-content">
      <div class="response-bar">
        <div class="response-status">
          <n-tag :type="statusTagType" size="large">
            {{ status }}
          </n-tag>
          <span class="status-text">{{ statusText }}</span>
        </div>

        <div class="response-info">
          <n-space :size="16">
            <span class="info-item">
              <n-icon :size="14" :color="'#666'">
                <TimeOutline />
              </n-icon>
              {{ duration }}
            </span>
            <span class="info-item">
              <n-icon :size="14" :color="'#666'">
                <CloudDownloadOutline />
              </n-icon>
              {{ size }}
            </span>
          </n-space>
        </div>

        <div class="response-actions">
          <n-space>
            <n-button text size="small" @click="handleDownload">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
              Download
            </n-button>
            <n-button text size="small" @click="handleCopy">
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
              Copy
            </n-button>
          </n-space>
        </div>
      </div>

      <n-tabs class="tab-container" v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="body" tab="Body">
          <ResponseBody />
        </n-tab-pane>
        <n-tab-pane name="headers" tab="Headers">
          <ResponseHeaders style="height: 100%;" />
        </n-tab-pane>
        <n-tab-pane name="cookies" tab="Cookies">
          <ResponseCookies />
        </n-tab-pane>
        <n-tab-pane name="tests" tab="Test Results">
          <ResponseTests />
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NIcon, NSpace, NTag, NTabs, NTabPane, useMessage } from 'naive-ui';
import {
  DocumentTextOutline,
  TimeOutline,
  CloudDownloadOutline,
  DownloadOutline,
  CopyOutline
} from '@vicons/ionicons5';
import { useResponseStore } from '@/stores/response';
import ResponseBody from './ResponseBody.vue';
import ResponseHeaders from './ResponseHeaders.vue';
import ResponseCookies from './ResponseCookies.vue';
import ResponseTests from './ResponseTests.vue';

const message = useMessage();
const responseStore = useResponseStore();

const activeTab = ref('body');

const hasResponse = computed(() => responseStore.hasResponse);
const status = computed(() => responseStore.status);
const statusText = computed(() => responseStore.statusText);
const duration = computed(() => responseStore.getDuration());
const size = computed(() => responseStore.getBodySize());

const statusTagType = computed(() => {
  if (!status.value) return 'default';
  if (status.value >= 200 && status.value < 300) return 'success';
  if (status.value >= 300 && status.value < 400) return 'warning';
  if (status.value >= 400 && status.value < 500) return 'error';
  if (status.value >= 500) return 'error';
  return 'default';
});

function handleDownload() {
  responseStore.downloadResponse();
  message.success('Response downloaded');
}

async function handleCopy() {
  const content = responseStore.getFormattedBody();
  try {
    await navigator.clipboard.writeText(content);
    message.success('Response copied to clipboard');
  } catch (error) {
    message.error('Failed to copy response');
  }
}
</script>

<style scoped>
.response-viewer {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding-bottom: 12px;
  flex: 1;
  min-height: 0;
}

.no-response {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.no-response p {
  margin-top: 16px;
  font-size: 14px;
}

.response-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.response-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: #fafafa;
  flex-shrink: 0;
}

.response-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  color: #666;
}

.response-info {
  display: flex;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
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
