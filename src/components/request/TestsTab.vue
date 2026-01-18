<template>
  <div class="tests-tab">
    <div class="script-header">
      <n-space>
        <n-switch :value="scriptEnabled" @update:value="handleEnabledChange">
          <template #checked>Enabled</template>
          <template #unchecked>Disabled</template>
        </n-switch>
        <n-button text @click="handleInsertSnippet">
          <template #icon>
            <n-icon><CodeIcon /></n-icon>
          </template>
          Snippets
        </n-button>
      </n-space>
    </div>

    <div class="script-editor-container" v-show="scriptEnabled">
      <MonacoEditor
        v-model:value="scriptContent"
        language="javascript"
        theme="vs-dark"
        :options="editorOptions"
        @change="handleContentChange"
        @ready="handleEditorReady"
      />
    </div>

    <div class="script-disabled-message" v-show="!scriptEnabled">
      <n-empty description="Test script is disabled. Enable it to edit and run tests." />
    </div>

    <n-drawer v-model:show="showSnippets" placement="right" :width="400">
      <n-drawer-content title="Code Snippets">
        <div class="snippets">
          <div
            v-for="snippet in snippets"
            :key="snippet.name"
            class="snippet-item"
            @click="handleInsertSnippetCode(snippet.code)"
          >
            <div class="snippet-name">{{ snippet.name }}</div>
            <div class="snippet-description">{{ snippet.description }}</div>
            <div class="snippet-code">{{ truncateCode(snippet.code) }}</div>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { NButton, NDrawer, NDrawerContent, NEmpty, NIcon, NSpace, NSwitch, useMessage } from 'naive-ui';
import { CodeSlashOutline as CodeIcon } from '@vicons/ionicons5';
import type { TestScript } from '@/types/request';
import MonacoEditor from '@/components/common/MonacoEditor.vue';

interface Props {
  script: TestScript;
}

interface Emits {
  (e: 'update', script: TestScript): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();

// Initialize with prop values or defaults
const scriptEnabled = ref(props.script?.enabled ?? false);
const scriptContent = ref(props.script?.content ?? '');
const showSnippets = ref(false);

// Monaco Editor state
let editorInstance: any = null;

const editorOptions = computed(() => ({
  fontSize: 13,
  fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
  lineNumbers: 'on' as const,
  minimap: { enabled: true },
  wordWrap: 'on' as const,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection' as const,
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: 'full' as const,
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: { enabled: true },
  folding: true,
  foldingStrategy: 'auto' as const,
  showFoldingControls: 'always' as const,
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true
  },
  lightbulb: { enabled: true }
}));

const snippets = [
  {
    name: 'Status code is 200',
    description: 'Check if response status code is 200',
    code: "pm.test('Status code is 200', function () {\n    pm.response.to.have.status(200);\n});"
  },
  {
    name: 'Status code is 201',
    description: 'Check if response status code is 201',
    code: "pm.test('Status code is 201', function () {\n    pm.response.to.have.status(201);\n});"
  },
  {
    name: 'Response time < 200ms',
    description: 'Check if response time is less than 200ms',
    code: "pm.test('Response time is less than 200ms', function () {\n    pm.expect(pm.response.responseTime()).to.be.below(200);\n});"
  },
  {
    name: 'Response body has property',
    description: 'Check if response body has specific property',
    code: "pm.test('Response has property', function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData).to.have.property('propertyName');\n});"
  },
  {
    name: 'Response body is correct',
    description: 'Validate entire response body',
    code: "pm.test('Response body is correct', function () {\n    pm.response.to.have.body('{\"response\":\"success\"}');\n});"
  },
  {
    name: 'Response headers contain value',
    description: 'Check if response headers contain specific value',
    code: "pm.test('Content-Type header is present', function () {\n    pm.response.to.have.header('Content-Type');\n});"
  },
  {
    name: 'Successful POST request',
    description: 'Test for successful POST request',
    code: "pm.test('Status code is 201', function () {\n    pm.response.to.have.status(201);\n});\n\npm.test('Response has data', function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData).to.have.property('id');\n});"
  },
  {
    name: 'Array length check',
    description: 'Check if response array has specific length',
    code: "pm.test('Array has 5 items', function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData.items).to.have.lengthOf(5);\n});"
  },
  {
    name: 'Check response JSON structure',
    description: 'Validate JSON response structure',
    code: "pm.test('Response has correct structure', function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData).to.have.property('data');\n    pm.expect(jsonData.data).to.be.an('array');\n    pm.expect(jsonData.data[0]).to.have.property('id');\n});"
  },
  {
    name: 'Multiple assertions',
    description: 'Run multiple test cases',
    code: "pm.test('Status is 200', function () {\n    pm.expect(pm.response.code()).to.eql(200);\n});\n\npm.test('Content-Type is JSON', function () {\n    pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');\n});\n\npm.test('Response has data', function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData).to.have.property('data');\n});"
  }
];

// Watch for prop changes
watch(() => props.script, (newScript) => {
  if (newScript) {
    scriptEnabled.value = newScript.enabled;
    scriptContent.value = newScript.content;
  }
}, { deep: true, immediate: true });

function handleEnabledChange(enabled: boolean) {
  scriptEnabled.value = enabled;
  emitUpdate();
}

function handleContentChange(content: string) {
  scriptContent.value = content;
  emitUpdate();
}

function emitUpdate() {
  emit('update', {
    enabled: scriptEnabled.value,
    content: scriptContent.value
  } as TestScript);
}

function handleInsertSnippet() {
  showSnippets.value = true;
}

function truncateCode(code: string): string {
  return code.split('\n')[0].substring(0, 60) + (code.split('\n')[0].length > 60 ? '...' : '');
}

function handleInsertSnippetCode(code: string) {
  const newContent = scriptContent.value + (scriptContent.value.length > 0 && !scriptContent.value.endsWith('\n') ? '\n\n' : '\n') + code;
  scriptContent.value = newContent;
  emitUpdate();
  showSnippets.value = false;
  message.success('Snippet inserted successfully');

  // Format code after insertion
  if (editorInstance) {
    setTimeout(() => {
      editorInstance.getAction('editor.action.formatDocument').run();
    }, 100);
  }
}


async function handleEditorReady(editor: any) {
  editorInstance = editor;

  // Set up PM API IntelliSense (if Monaco is available)
  try {
    const monaco = await import('monaco-editor');

    if (monaco) {
      monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: (_model: any, _position: any) => {
          const suggestions = [
            {
              label: 'pm.test',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.test("name", () => {\n  // test code\n});',
              detail: 'Define a test',
              documentation: 'Define a test case'
            },
            {
              label: 'pm.response.code',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.response.code()',
              detail: 'Response status code',
              documentation: 'Get response status code'
            },
            {
              label: 'pm.response.json',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.response.json()',
              detail: 'Parse response as JSON',
              documentation: 'Parse response body as JSON'
            },
            {
              label: 'pm.response.text',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.response.text()',
              detail: 'Get response as text',
              documentation: 'Get response body as text'
            },
            {
              label: 'pm.response.headers',
              kind: (monaco.languages.CompletionItemKind as any).Module,
              insertText: 'pm.response.headers',
              detail: 'Response headers API',
              documentation: 'Access response headers'
            },
            {
              label: 'pm.expect',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.expect(value)',
              detail: 'Assertion helper',
              documentation: 'Create an assertion'
            }
          ];

          return { suggestions } as any;
        }
      } as any);
    }
  } catch (error) {
    console.warn('Failed to set up Monaco completions:', error);
  }
}

onUnmounted(() => {
  if (editorInstance) {
    editorInstance.dispose();
  }
});
</script>

<style scoped>
.tests-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.script-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
  background: var(--n-color-modal);
}

.script-editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.script-editor-container :deep(.monaco-editor) {
  height: 100% !important;
}

.script-disabled-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.snippets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.snippet-item {
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--n-color);
}

.snippet-item:hover {
  border-color: var(--primary-color);
  background-color: rgba(24, 160, 88, 0.05);
  transform: translateX(4px);
}

.snippet-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--n-text-color);
  margin-bottom: 8px;
}

.snippet-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.snippet-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  color: #888;
  background: var(--n-color-modal);
  padding: 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
