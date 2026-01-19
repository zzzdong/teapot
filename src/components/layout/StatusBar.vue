<template>
  <div class="status-bar">
    <div class="status-left">
      <span v-if="requestStore.isSending" class="status-sending">
        Sending request...
      </span>
      <span v-else class="status-ready">
        Ready
      </span>
    </div>

    <div class="status-right">
      <n-button text size="small" @click="toggleConsole" class="console-button">
        <template #icon>
          <n-icon><TerminalOutline /></n-icon>
        </template>
        Console
      </n-button>
      <span class="status-divider">|</span>
      <span class="status-info">
        Method: {{ requestStore.method }}
      </span>
      <span class="status-divider">|</span>
      <span class="status-info">
        Environment: {{ environmentStore.currentEnvironment?.name || 'None' }}
      </span>
      <span class="status-divider">|</span>
      <span class="status-info">
        {{ currentTime }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRequestStore } from '@/stores/request';
import { useEnvironmentStore } from '@/stores/environment';
import { useWorkspaceStore } from '@/stores/workspace';
import { NButton, NIcon } from 'naive-ui';
import { TerminalOutline } from '@vicons/ionicons5';

const requestStore = useRequestStore();
const environmentStore = useEnvironmentStore();
const workspaceStore = useWorkspaceStore();

const currentTime = ref('');

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString();
}

function toggleConsole() {
  workspaceStore.toggleConsole();
}

let timer: number;

onMounted(() => {
  updateTime();
  timer = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 16px;
  background-color: #f5f5f5;
  border-top: 1px solid var(--border-color);
  font-size: 12px;
}

.status-left {
  display: flex;
  align-items: center;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-sending {
  color: var(--info-color);
}

.status-ready {
  color: var(--success-color);
}

.status-divider {
  color: #999;
}

.status-info {
  color: #666;
}

.console-button {
  font-size: 12px;
  padding: 0 8px;
  min-width: auto;
}
</style>
