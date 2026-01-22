<template>
  <div class="left-sidebar">
    <n-tabs
      v-model:value="activeTab"
      type="line"
      animated
      :bar-width="40"
    >
      <n-tab-pane
        name="collections"
        tab="Collections"
      >
        <CollectionsPanel />
      </n-tab-pane>
      <n-tab-pane
        name="history"
        tab="History"
      >
        <HistoryPanel />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import CollectionsPanel from './CollectionsPanel.vue';
import HistoryPanel from './HistoryPanel.vue';

const activeTab = ref('collections');
</script>

<style scoped>
.left-sidebar {
  width: 280px;
  border-right: 1px solid var(--border-color);
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
