<template>
  <div class="script-log-panel">
    <div class="log-header">
      <div class="log-header-left">
        <n-space align="center">
          <n-icon size="16">
            <TerminalIcon />
          </n-icon>
          <span class="log-title">Script Console</span>
          <n-tag :type="hasErrors ? 'error' : hasWarnings ? 'warning' : 'success'" size="small">
            {{ logs.length }} logs
          </n-tag>
        </n-space>
      </div>
      <div class="log-header-right">
        <n-space align="center">
          <n-switch v-model:value="autoScroll" size="small">
            <template #checked>Auto-scroll</template>
            <template #unchecked>Manual</template>
          </n-switch>
          <n-button text size="small" @click="filterLevel = 'all'" :type="filterLevel === 'all' ? 'primary' : 'default'">
            All
          </n-button>
          <n-button text size="small" @click="filterLevel = 'info'" :type="filterLevel === 'info' ? 'primary' : 'default'">
            Info
          </n-button>
          <n-button text size="small" @click="filterLevel = 'log'" :type="filterLevel === 'log' ? 'primary' : 'default'">
            Log
          </n-button>
          <n-button text size="small" @click="filterLevel = 'warn'" :type="filterLevel === 'warn' ? 'primary' : 'default'">
            Warn
          </n-button>
          <n-button text size="small" @click="filterLevel = 'error'" :type="filterLevel === 'error' ? 'primary' : 'default'">
            Error
          </n-button>
          <n-divider vertical />
          <n-button text size="small" @click="handleClear">
            <template #icon>
              <n-icon><TrashIcon /></n-icon>
            </template>
            Clear
          </n-button>
        </n-space>
      </div>
    </div>

    <div class="log-content" ref="logContentRef">
      <div v-if="filteredLogs.length === 0" class="log-empty">
        <n-empty description="No logs yet" size="small" />
      </div>
      <div v-else class="log-entries">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          :class="['log-entry', `log-${log.level}`]"
        >
          <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { NButton, NDivider, NEmpty, NIcon, NSpace, NSwitch, NTag } from 'naive-ui';
import {
  TerminalOutline as TerminalIcon,
  TrashOutline as TrashIcon
} from '@vicons/ionicons5';
import type { ScriptLogEntry } from '@/utils/scriptExecutor';

interface Props {
  logs: ScriptLogEntry[];
}

const props = defineProps<Props>();

const filterLevel = ref<'all' | 'info' | 'log' | 'warn' | 'error'>('all');
const autoScroll = ref(true);
const logContentRef = ref<HTMLElement>();

const filteredLogs = computed(() => {
  if (filterLevel.value === 'all') {
    return props.logs;
  }
  return props.logs.filter(log => log.level === filterLevel.value);
});

const hasErrors = computed(() => props.logs.some(log => log.level === 'error'));
const hasWarnings = computed(() => props.logs.some(log => log.level === 'warn'));

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function handleClear() {
  // Emit clear event to parent
  emit('clear');
}

const emit = defineEmits<{
  clear: [];
}>();

// Auto-scroll to bottom when logs change
watch(() => props.logs.length, async () => {
  if (autoScroll.value && logContentRef.value) {
    await nextTick();
    logContentRef.value.scrollTop = logContentRef.value.scrollHeight;
  }
});
</script>

<style scoped>
.script-log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-modal);
}

.log-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-header-right {
  display: flex;
  align-items: center;
}

.log-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--n-color);
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100px;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 2px;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-entry:hover {
  background: rgba(24, 160, 88, 0.05);
}

.log-timestamp {
  color: #999;
  flex-shrink: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.log-level {
  font-weight: 600;
  flex-shrink: 0;
  min-width: 50px;
}

.log-message {
  flex: 1;
  color: var(--n-text-color);
}

.log-info .log-level {
  color: #2080f0;
}

.log-log .log-level {
  color: #666;
}

.log-warn .log-level {
  color: #f0a020;
}

.log-error .log-level {
  color: #d03050;
}

.log-error {
  background: rgba(208, 48, 80, 0.05);
}

/* Scrollbar styling */
.log-content::-webkit-scrollbar {
  width: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: transparent;
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
