<template>
  <div class="console-panel">
    <div class="panel-header">
      <span>Console</span>
      <n-space>
        <n-button text size="small" @click="handleClearLogs">
          <template #icon>
            <n-icon><TrashOutline /></n-icon>
          </template>
          Clear
        </n-button>
      </n-space>
    </div>

    <div class="console-content" ref="contentRef">
      <div v-if="logs.length === 0" class="empty-state">
        <n-icon size="48" :color="'#ccc'">
          <TerminalOutline />
        </n-icon>
        <p>Console is empty</p>
        <p class="hint">Script execution logs will appear here</p>
      </div>

      <div v-else class="logs-list">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="'log-' + log.type"
        >
          <div class="log-header">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-type">{{ log.type.toUpperCase() }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.data" class="log-data">
            <n-code :code="formatData(log.data)" language="json" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { NButton, NIcon, NCode, NSpace } from 'naive-ui';
import { TrashOutline, TerminalOutline } from '@vicons/ionicons5';
import dayjs from 'dayjs';
import { useConsoleStore } from '@/stores/console';

const consoleStore = useConsoleStore();

const contentRef = ref<HTMLElement>();

const logs = computed(() => consoleStore.logs);

// Auto-scroll to bottom when logs are added
watch(logs, () => {
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight;
    }
  });
}, { deep: true });

function handleClearLogs() {
  consoleStore.clear();
}

function formatTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm:ss.SSS');
}

function formatData(data: any): string {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return String(data);
}
</script>

<style scoped>
.console-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  font-weight: 600;
}

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin-top: 8px;
  font-size: 14px;
}

.hint {
  margin-top: 4px;
  font-size: 12px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  padding: 8px;
  border-radius: 4px;
  background-color: #fafafa;
  border-left: 3px solid #999;
}

.log-log {
  border-left-color: #2080f0;
}

.log-info {
  border-left-color: #18a058;
}

.log-warn {
  border-left-color: #f0a020;
  background-color: #fffbeb;
}

.log-error {
  border-left-color: #d03050;
  background-color: #fef2f2;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
}

.log-time {
  color: #999;
}

.log-type {
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 2px;
}

.log-log .log-type { color: #2080f0; }
.log-info .log-type { color: #18a058; }
.log-warn .log-type { color: #f0a020; }
.log-error .log-type { color: #d03050; }

.log-message {
  font-size: 12px;
  margin-bottom: 4px;
  color: #333;
  word-break: break-word;
}

.log-data {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
}
</style>
