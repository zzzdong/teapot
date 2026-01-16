<template>
  <div class="tests-panel">
    <div class="panel-header">
      <span>Test Results</span>
      <n-button text size="small" @click="handleClearResults">
        Clear
      </n-button>
    </div>

    <div class="tests-content">
      <div v-if="testResults.length === 0" class="empty-state">
        <n-icon size="48" :color="'#ccc'">
          <CheckmarkCircleOutline />
        </n-icon>
        <p>No test results</p>
        <p class="hint">Run a request with tests to see results</p>
      </div>

      <div v-else>
        <div class="test-summary">
          <div class="summary-card">
            <div class="summary-number">{{ totalTests }}</div>
            <div class="summary-label">Total</div>
          </div>
          <div class="summary-card success">
            <div class="summary-number">{{ passedTests }}</div>
            <div class="summary-label">Passed</div>
          </div>
          <div class="summary-card error">
            <div class="summary-number">{{ failedTests }}</div>
            <div class="summary-label">Failed</div>
          </div>
        </div>

        <div class="test-list">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            class="test-item"
            :class="{ failed: !result.passed }"
          >
            <n-icon :size="20" :color="result.passed ? '#18a058' : '#d03050'">
              <CheckmarkCircleOutline v-if="result.passed" />
              <CloseCircleOutline v-else />
            </n-icon>
            <div class="test-info">
              <div class="test-name">{{ result.name }}</div>
              <div v-if="!result.passed" class="test-error">{{ result.message }}</div>
              <div class="test-duration">{{ result.duration }}ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NIcon } from 'naive-ui';
import { CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5';

// Mock test results - in real implementation, this would be connected to store
const testResults = ref([
  { name: 'Status code is 200', passed: true, duration: 5 },
  { name: 'Response has data property', passed: true, duration: 3 },
  { name: 'Response time < 200ms', passed: false, duration: 2, message: 'Expected response time to be below 200ms, but was 350ms' }
]);

const totalTests = computed(() => testResults.value.length);
const passedTests = computed(() => testResults.value.filter(t => t.passed).length);
const failedTests = computed(() => testResults.value.filter(t => !t.passed).length);

function handleClearResults() {
  testResults.value = [];
}
</script>

<style scoped>
.tests-panel {
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

.tests-content {
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

.test-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-card {
  flex: 1;
  padding: 12px;
  border-radius: 4px;
  background-color: #fafafa;
  border: 1px solid var(--border-color);
  text-align: center;
}

.summary-card.success {
  background-color: #f0f9ff;
  border-color: #bae6fd;
}

.summary-card.error {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.summary-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.summary-card.success .summary-number {
  color: #18a058;
}

.summary-card.error .summary-number {
  color: #d03050;
}

.summary-label {
  font-size: 12px;
  color: #666;
}

.test-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 4px;
  background-color: #fff;
  border: 1px solid var(--border-color);
}

.test-item.failed {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.test-info {
  flex: 1;
}

.test-name {
  font-weight: 500;
  font-size: 13px;
  margin-bottom: 4px;
}

.test-error {
  font-size: 12px;
  color: #d03050;
  margin-bottom: 4px;
}

.test-duration {
  font-size: 11px;
  color: #999;
}
</style>
