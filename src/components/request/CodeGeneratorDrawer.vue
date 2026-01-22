<template>
  <n-drawer
    v-model:show="drawerVisible"
    :width="600"
    placement="right"
    :trap-focus="false"
    :auto-focus="false"
  >
    <n-drawer-content
      title="Generate Code"
      closable
    >
      <div class="code-generator-drawer">
        <div class="language-selector">
          <n-select
            id="language"
            v-model:value="selectedLanguage"
            :options="selectOptions"
            placeholder="Choose a language"
            style="width: 100%"
          />

          <n-button
            type="primary"
            @click="copyCode"
          >
            <template #icon>
              <n-icon>
                <CopyOutline />
              </n-icon>
            </template>
            Copy Code
          </n-button>
        </div>

        <div class="code-output">
          <n-text strong>Generated Code</n-text>
          <MonacoEditor
            :value="generatedCode"
            :language="codeLanguage"
            :options="editorOptions"
          />
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NDrawer, NDrawerContent, NButton, NSelect, NIcon, NText, useMessage } from 'naive-ui';
import { CopyOutline } from '@vicons/ionicons5';
import type { RequestContext } from '@/types';
import MonacoEditor from '@/components/common/MonacoEditor.vue';
import { generateCode, languageOptions, languageMap } from '@/utils/codeGenerator';

const selectOptions = languageOptions.map((opt) => ({
  ...opt,
}));

interface Props {
  show?: boolean;
  context: RequestContext | null;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
});
const emit = defineEmits<Emits>();

const drawerVisible = computed({
  get: () => props.show || false,
  set: (value) => emit('update:show', value),
});

const message = useMessage();
const selectedLanguage = ref('curl');

const codeLanguage = computed(() => {
  return languageMap[selectedLanguage.value] || 'javascript';
});

// Monaco Editor 只读选项
const editorOptions = computed(() => ({
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  lineNumbers: 'on',
  wordWrap: 'on',
  padding: { top: 16, bottom: 16 },
}));

const generatedCode = computed(() => {
  return generateCode(selectedLanguage.value, props.context);
});

function copyCode() {
  if (generatedCode.value) {
    navigator.clipboard
      .writeText(generatedCode.value)
      .then(() => {
        message.success('Code copied to clipboard');
      })
      .catch(() => {
        message.error('Failed to copy code');
      });
  }
}

watch(
  () => props.context,
  () => {
    // Reset language when context changes
    selectedLanguage.value = 'curl';
  }
);
</script>

<style scoped>
.code-generator-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 0;
}

.language-selector {
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-shrink: 0;
}

.code-output {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 16px;
}

.code-output :deep(.monaco-editor-container) {
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  flex: 1;
  min-height: 0;
}
</style>
