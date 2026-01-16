<template>
  <div class="right-sidebar">
    <n-tabs
      v-model:value="activeTab"
      type="line"
      animated
      :bar-width="40"
    >
      <n-tab-pane name="environment" tab="Environment">
        <EnvironmentPanel />
      </n-tab-pane>
      <n-tab-pane name="console" tab="Console">
        <ConsolePanel />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import EnvironmentPanel from './EnvironmentPanel.vue';
import ConsolePanel from './ConsolePanel.vue';

const activeTab = ref('environment');
</script>

<style scoped>
.right-sidebar {
  width: 300px;
  border-left: 1px solid var(--border-color);
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-nav) {
  padding: 8px;
}

:deep(.n-tabs-nav-scroll-content) {
  border-bottom: 1px solid var(--border-color);
}

:deep(.n-tab-pane) {
  height: 100%;
  overflow-y: auto;
}
</style>
