<template>
  <div class="request-builder">
    <n-tabs class="tab-container" v-model:value="activeTab" type="line" animated>
      <template #suffix>
        <n-button text @click="codeGeneratorVisible = true">
          <template #icon>
            <n-icon>
              <CodeSlashOutline />
            </n-icon>
          </template>
          Code
        </n-button>
      </template>
      <n-tab-pane name="params" tab="Params">
        <ParamsTab :params="request.params" @update:params="handleParamsUpdate" />
      </n-tab-pane>
      <n-tab-pane name="headers" tab="Headers">
        <HeadersTab :headers="request.headers" @update:headers="handleHeadersUpdate" />
      </n-tab-pane>
      <n-tab-pane name="body" tab="Body">
        <BodyTab v-model:body="request.body" />
      </n-tab-pane>
      <n-tab-pane name="auth" tab="Authorization">
        <AuthTab :auth="request.auth" @update:auth="handleAuthUpdate" />
      </n-tab-pane>
      <n-tab-pane name="pre-request" tab="Pre-request Script">
        <PreRequestScriptTab :script="request.preRequestScript" @update="handlePreRequestScriptUpdate" />
      </n-tab-pane>
      <n-tab-pane name="tests" tab="Tests">
        <TestsTab :script="request.testScript" @update="handleTestScriptUpdate" />
      </n-tab-pane>
    </n-tabs>

    <CodeGeneratorDrawer v-model:show="codeGeneratorVisible" :context="context" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NTabs, NTabPane, NButton, NIcon, useMessage } from 'naive-ui';
import { CodeSlashOutline } from '@vicons/ionicons5';
import { useWorkspaceStore } from '@/stores/workspace';
import type { RequestContext, TestScript, PreRequestScript, RequestParam, RequestHeader, AuthConfig } from '@/types';
import ParamsTab from './ParamsTab.vue';
import AuthTab from './AuthTab.vue';
import HeadersTab from './HeadersTab.vue';
import BodyTab from './BodyTab.vue';
import PreRequestScriptTab from './PreRequestScriptTab.vue';
import TestsTab from './TestsTab.vue';
import CodeGeneratorDrawer from './CodeGeneratorDrawer.vue';

const props = defineProps<{
  tabId: string;
}>();

const context = defineModel<RequestContext>('context', { required: true });
const request = computed(() => context.value?.request);

const message = useMessage();
const workspaceStore = useWorkspaceStore();

// Watch for body changes and persist to store
watch(() => request.value?.body, (newBody) => {
  if (newBody && props.tabId && context.value?.request) {
    // Ensure the body is properly updated in the request object
    context.value.request.body = newBody;
    context.value.request.updatedAt = Date.now();
    workspaceStore.updateTabContext(props.tabId, {
      request: context.value.request
    });
  }
}, { deep: true, immediate: true });

function handleTestScriptUpdate(newTestScript: TestScript) {
  if (context.value && context.value.request) {
    context.value.request.testScript = newTestScript;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handlePreRequestScriptUpdate(newPreRequestScript: PreRequestScript) {
  if (context.value && context.value.request) {
    context.value.request.preRequestScript = newPreRequestScript;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handleParamsUpdate(newParams: RequestParam[]) {
  if (context.value && context.value.request) {
    context.value.request.params = newParams;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handleHeadersUpdate(newHeaders: RequestHeader[]) {
  if (context.value && context.value.request) {
    context.value.request.headers = newHeaders;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

function handleAuthUpdate(newAuth: AuthConfig) {
  if (context.value && context.value.request) {
    context.value.request.auth = newAuth;
    context.value.request.updatedAt = Date.now();

    if (props.tabId) {
      workspaceStore.updateTabContext(props.tabId, {
        request: context.value.request
      });
    }
  }
}

const activeTab = ref('params');
const codeGeneratorVisible = ref(false);

</script>

<style scoped>
.request-builder {
  display: flex;
  flex-direction: column;
  flex: 1;
  border-bottom: 1px solid var(--border-color);
  min-height: 0;
}

.request-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
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
