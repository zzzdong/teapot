<template>
  <div class="history-panel">
    <div class="panel-header">
      <n-input
        v-model:value="searchText"
        placeholder="Search history..."
        size="small"
        clearable
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
      <n-button text size="small" @click="handleClearHistory">
        <template #icon>
          <n-icon><TrashOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <n-scrollbar style="max-height: calc(100vh - 140px)">
      <div v-if="filteredItems.length === 0" class="empty-state">
        <n-icon size="48" :color="'#ccc'">
          <TimeOutline />
        </n-icon>
        <p>No history</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="history-item"
          @click="handleLoadHistory(item)"
        >
          <div class="history-header">
            <span class="method-badge" :class="'method-' + item.request.method">
              {{ item.request.method }}
            </span>
            <n-icon v-if="item.favorited" :size="16" :color="'#f0a020'">
              <StarOutline />
            </n-icon>
          </div>
          <div class="history-name">{{ item.name }}</div>
          <div class="history-url">{{ truncateText(item.request.url, 30) }}</div>
          <div class="history-meta">
            {{ formatTime(item.timestamp) }}
            <span v-if="item.response" class="response-status" :class="getStatusClass(item.response.status)">
              {{ item.response.status }}
            </span>
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NButton, NIcon, NInput, NScrollbar, useDialog } from 'naive-ui';
import { SearchOutline, TrashOutline, TimeOutline, StarOutline } from '@vicons/ionicons5';
import { useHistoryStore } from '@/stores/history';

import { useWorkspaceStore } from '@/stores/workspace';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const dialog = useDialog();
const historyStore = useHistoryStore();

const workspaceStore = useWorkspaceStore();

const searchText = ref('');

const filteredItems = computed(() => {
  if (!searchText.value) {
    return historyStore.filteredHistory;
  }

  const search = searchText.value.toLowerCase();
  return historyStore.filteredHistory.filter(item =>
    item.request.url.toLowerCase().includes(search) ||
    item.request.method.toLowerCase().includes(search) ||
    item.name.toLowerCase().includes(search)
  );
});

function handleLoadHistory(item: any) {
  workspaceStore.loadRequestIntoNewTab(item.request);
}

function handleClearHistory() {
  dialog.warning({
    title: 'Clear History',
    content: 'Are you sure you want to clear all history?',
    positiveText: 'Clear',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      historyStore.clearHistory();
    }
  });
}

function formatTime(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}

function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

function getStatusClass(status: number): string {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return '';
}
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.history-item {
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background-color: rgba(24, 160, 88, 0.1);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.method-badge {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 600;
}

.method-GET { color: #18a058; }
.method-POST { color: #2080f0; }
.method-PUT { color: #f0a020; }
.method-DELETE { color: #d03050; }
.method-PATCH { color: #18a058; }
.method-HEAD { color: #8a2be2; }
.method-OPTIONS { color: #8a2be2; }

.history-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-url {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #999;
}

.response-status {
  font-weight: 600;
}

.response-status.success { color: #18a058; }
.response-status.redirect { color: #f0a020; }
.response-status.client-error { color: #d03050; }
.response-status.server-error { color: #d03050; }
</style>
