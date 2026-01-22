<template>
  <div class="response-tests">
    <div
      v-if="testResults.length === 0"
      class="no-tests"
    >
      <n-icon
        size="48"
        :color="'#ccc'"
      >
        <CheckmarkCircleOutline />
      </n-icon>
      <p>No tests executed</p>
      <p class="hint">Add tests in the Tests tab of the request builder</p>
    </div>

    <div
      v-else
      class="test-results"
    >
      <div class="test-summary">
        <n-space :size="20">
          <span class="summary-item">
            <span class="summary-label">Total:</span>
            <span class="summary-value">{{ totalTests }}</span>
          </span>
          <span class="summary-item passed">
            <span class="summary-label">Passed:</span>
            <span class="summary-value">{{ passedTests }}</span>
          </span>
          <span class="summary-item failed">
            <span class="summary-label">Failed:</span>
            <span class="summary-value">{{ failedTests }}</span>
          </span>
        </n-space>
      </div>

      <n-list>
        <n-list-item
          v-for="(result, index) in testResults"
          :key="index"
        >
          <div
            class="test-item"
            :class="{ failed: !result.passed }"
          >
            <n-icon
              :size="20"
              :color="result.passed ? '#18a058' : '#d03050'"
            >
              <CheckmarkCircleOutline v-if="result.passed" />
              <CloseCircleOutline v-else />
            </n-icon>
            <div class="test-content">
              <div class="test-name">{{ result.name }}</div>
              <div
                v-if="!result.passed"
                class="test-message"
              >
                {{ result.message }}
              </div>
            </div>
            <div class="test-duration">{{ result.duration }}ms</div>
          </div>
        </n-list-item>
      </n-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NIcon, NList, NListItem, NSpace } from 'naive-ui';
import { CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5';
import type { ScriptLogEntry } from '@/types/script';
import type { RequestContext } from '@/types';

interface Props {
  context: RequestContext;
}

const props = defineProps<Props>();

// Parse test results from context test result
const testResults = computed(() => {
  const testResult = props.context?.testResult;
  const logs = testResult?.logs || [];
  console.log('testLogs:', logs);
  const results: Array<{ name: string; passed: boolean; duration?: number; message?: string }> = [];

  // Parse logs to extract test results
  logs.forEach((log: ScriptLogEntry) => {
    const message = log.message;
    console.log('Processing log:', log.level, message);

    // Check for test passed (final result)
    const passedMatch = message.match(/^✓ Test passed: (.+)$/);
    if (passedMatch) {
      console.log('Passed match:', passedMatch[1]);
      const existingTest = results.find((r) => r.name === passedMatch[1]);
      if (existingTest) {
        existingTest.passed = true;
      } else {
        results.push({ name: passedMatch[1], passed: true, duration: 0 });
      }
      return;
    }

    // Check for test failed (final result)
    const failedMatch = message.match(/^✗ Test failed: (.+) - (.+)$/);
    if (failedMatch) {
      console.log('Failed match:', failedMatch[1], failedMatch[2]);
      const existingTest = results.find((r) => r.name === failedMatch[1]);
      if (existingTest) {
        existingTest.passed = false;
        existingTest.message = failedMatch[2];
      } else {
        results.push({ name: failedMatch[1], passed: false, duration: 0, message: failedMatch[2] });
      }
      return;
    }

    // Check for test started (only add if not already in results)
    const testMatch = message.match(/^Test: (.+)$/);
    if (testMatch && !results.find((r) => r.name === testMatch[1])) {
      console.log('Test start match:', testMatch[1]);
      results.push({ name: testMatch[1], passed: true, duration: 0 });
    }

    // Check for assertion errors (for pm.response.to.have.status style)
    if (log.level === 'error' && message.startsWith('Script execution error:')) {
      const errorMatch = message.match(/Script execution error: (.+)/);
      if (errorMatch) {
        const errorText = errorMatch[1];
        // Try to extract test name from error message
        const testInErrorMatch = errorText.match(/Expected (.+), but got/);
        if (testInErrorMatch) {
          const testName = `Assertion: ${testInErrorMatch[1]}`;
          if (!results.find((r) => r.name === testName)) {
            results.push({ name: testName, passed: false, duration: 0, message: errorText });
          }
        }
      }
    }
  });

  console.log('Parsed results:', results);
  return results;
});

const totalTests = computed(() => testResults.value.length);
const passedTests = computed(() => testResults.value.filter((t) => t.passed).length);
const failedTests = computed(() => testResults.value.filter((t) => !t.passed).length);
</script>

<style scoped>
.response-tests {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 0;
}

.no-tests {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #999;
}

.no-tests p {
  margin-top: 8px;
  font-size: 14px;
}

.hint {
  margin-top: 4px;
  font-size: 12px;
}

.test-results {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  gap: 16px;
}

.test-summary {
  padding: 12px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.summary-item {
  display: flex;
  gap: 4px;
  font-size: 14px;
}

.summary-label {
  font-weight: 500;
  color: #666;
}

.summary-value {
  font-weight: bold;
}

.summary-item.passed .summary-value {
  color: var(--success-color);
}

.summary-item.failed .summary-value {
  color: var(--error-color);
}

.test-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
}

.test-item.failed {
  background-color: #fef2f2;
  border-radius: 4px;
}

.test-content {
  flex: 1;
}

.test-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.test-message {
  font-size: 12px;
  color: var(--error-color);
  margin-top: 4px;
}

.test-duration {
  font-size: 12px;
  color: #999;
  min-width: 50px;
  text-align: right;
}
</style>
