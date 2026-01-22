<template>
  <div class="documentation-panel">
    <div class="empty-state">
      <n-icon
        size="64"
        :color="'#ccc'"
      >
        <DocumentTextOutline />
      </n-icon>
      <h3>Documentation</h3>
      <p>Coming soon</p>
      <p class="hint">Add and view API documentation here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon } from 'naive-ui';
import { DocumentTextOutline } from '@vicons/ionicons5';
</script>

<style scoped>
.documentation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #999;
}

.empty-state h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.empty-state p {
  margin: 4px 0;
  font-size: 14px;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
}
</style>
