<template>
  <div class="pre-request-script-tab">
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
        <n-button text @click="handleRunScript" :loading="isRunning">
          <template #icon>
            <n-icon><PlayIcon /></n-icon>
          </template>
          Run Script
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
      <n-empty description="Script is disabled. Enable it to edit and run." />
    </div>

    <div class="script-logs" v-if="logs.length > 0 || isRunning">
      <n-collapse>
        <n-collapse-item title="Console Output" name="logs">
          <ScriptLogPanel :logs="logs" @clear="handleClearLogs" />
        </n-collapse-item>
      </n-collapse>
    </div>

    <n-drawer v-model:show="showSnippets" placement="right" :width="500">
      <n-drawer-content title="Code Snippets">
        <div class="snippets">
          <div
            v-for="snippet in snippets"
            :key="snippet.name"
            class="snippet-item"
            @click="handleInsertSnippetCode(snippet.code)"
          >
            <div class="snippet-header">
              <n-icon size="18"><CodeIcon /></n-icon>
              <div class="snippet-name">{{ snippet.name }}</div>
            </div>
            <div class="snippet-description">{{ snippet.description }}</div>
            <div class="snippet-code">{{ truncateCode(snippet.code) }}</div>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { NButton, NCollapse, NCollapseItem, NDrawer, NDrawerContent, NEmpty, NIcon, NSpace, NSwitch, useMessage } from 'naive-ui';
import { CodeSlashOutline as CodeIcon, PlayOutline as PlayIcon } from '@vicons/ionicons5';
import type { PreRequestScript } from '@/types/request';
import type { ScriptContext, ScriptResult, ScriptLogEntry } from '@/types/script';
import { executeScript, validateScriptSyntax } from '@/utils/scriptExecutor';
import ScriptLogPanel from './ScriptLogPanel.vue';
import MonacoEditor from '@/components/common/MonacoEditor.vue';
import { useEnvironmentStore } from '@/stores/environment';

interface Props {
  script: PreRequestScript;
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
}

interface Emits {
  (e: 'update', script: PreRequestScript): void;
  (e: 'scriptExecuted', result: ScriptResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();
const environmentStore = useEnvironmentStore();

const scriptEnabled = ref(props.script.enabled);
const scriptContent = ref(props.script.content);
const logs = ref<ScriptLogEntry[]>([]);
const isRunning = ref(false);
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
    name: 'Set Environment Variable',
    description: 'Set a value to an environment variable',
    code: "pm.environment.set('variable_key', 'variable_value');"
  },
  {
    name: 'Get Environment Variable',
    description: 'Get a value from an environment variable',
    code: "const value = pm.environment.get('variable_key');\nconsole.log(value);"
  },
  {
    name: 'Clear Environment Variable',
    description: 'Clear an environment variable',
    code: "pm.environment.unset('variable_key');"
  },
  {
    name: 'Set Global Variable',
    description: 'Set a value to a global variable',
    code: "pm.globals.set('variable_key', 'variable_value');"
  },
  {
    name: 'Generate Random ID',
    description: 'Generate a random ID',
    code: "const randomId = 'id_' + Math.floor(Math.random() * 1000);\npm.environment.set('randomId', randomId);"
  },
  {
    name: 'Set Timestamp',
    description: 'Set current timestamp',
    code: "const timestamp = Date.now();\npm.environment.set('timestamp', timestamp);"
  },
  {
    name: 'Generate UUID',
    description: 'Generate a UUID v4',
    code: "const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {\n  const r = Math.random() * 16 | 0;\n  const v = c === 'x' ? r : (r & 0x3 | 0x8);\n  return v.toString(16);\n});\npm.environment.set('uuid', uuid);"
  },
  {
    name: 'Parse JSON Response',
    description: 'Parse and use JSON response data',
    code: "// Parse JSON string\nconst jsonData = JSON.parse(pm.response.text());\n\n// Get specific field\nconst userId = jsonData.data.user.id;\npm.environment.set('userId', userId);"
  },
  {
    name: 'Request URL',
    description: 'Get request URL',
    code: "const url = pm.request.url.get();\nconsole.log('Request URL:', url);"
  },
  {
    name: 'Set Request Header',
    description: 'Set a request header',
    code: "pm.request.headers.add({\n  key: 'Header-Name',\n  value: 'Header-Value'\n});"
  },
  {
    name: 'Remove Request Header',
    description: 'Remove a request header',
    code: "pm.request.headers.remove('Header-Name');"
  },
  {
    name: 'Modify Request URL',
    description: 'Change the request URL dynamically',
    code: "const baseUrl = pm.environment.get('base_url');\nconst endpoint = '/api/users';\npm.request.url.set(baseUrl + endpoint);"
  },
  {
    name: 'Send Chained Request',
    description: 'Send a request within the script',
    code: "pm.sendRequest('https://api.example.com/token', function (err, response) {\n  if (err) {\n    console.error(err);\n  } else {\n    const token = response.json().token;\n    pm.environment.set('auth_token', token);\n  }\n});"
  },
  {
    name: 'Add Authorization Header',
    description: 'Add Bearer token authorization',
    code: "const token = pm.environment.get('auth_token');\npm.request.headers.add({\n  key: 'Authorization',\n  value: `Bearer ${token}`\n});"
  },
  {
    name: 'Test Response Status',
    description: 'Test response status code',
    code: "pm.test('Status code is 200', function () {\n  pm.expect(pm.response.code()).to.eql(200);\n});"
  },
  {
    name: 'Test Response Property',
    description: 'Test response has specific property',
    code: "pm.test('Response has data property', function () {\n  const jsonData = pm.response.json();\n  pm.expect(jsonData).to.have.property('data');\n});"
  },
  {
    name: 'Dynamic Environment',
    description: 'Set environment based on conditions',
    code: "const environment = pm.environment.get('environment');\n\nif (environment === 'production') {\n  pm.environment.set('api_url', 'https://api.example.com');\n} else if (environment === 'staging') {\n  pm.environment.set('api_url', 'https://staging-api.example.com');\n} else {\n  pm.environment.set('api_url', 'http://localhost:3000');\n}"
  },
  {
    name: 'Hash String',
    description: 'Generate MD5 hash of a string',
    code: "const crypto = require('crypto-js');\nconst data = 'Hello, World!';\nconst hash = crypto.MD5(data).toString();\npm.environment.set('data_hash', hash);"
  },
  {
    name: 'Base64 Encode/Decode',
    description: 'Base64 encode or decode strings',
    code: "// Encode\nconst encoded = btoa(pm.environment.get('username') + ':' + pm.environment.get('password'));\npm.request.headers.add({\n  key: 'Authorization',\n  value: 'Basic ' + encoded\n});\n\n// Decode\nconst decoded = atob(encoded);\nconsole.log('Decoded:', decoded);"
  },
  {
    name: 'Parse Query Parameters',
    description: 'Parse and use query parameters',
    code: "const url = new URL(pm.request.url.get());\nconst params = new URLSearchParams(url.search);\n\n// Get specific parameter\nconst userId = params.get('user_id');\npm.environment.set('user_id', userId);"
  },
  {
    name: 'Delay Execution',
    description: 'Add delay between requests',
    code: "const delay = ms => new Promise(resolve => setTimeout(resolve, ms));\n\npm.info('Waiting for 2 seconds...');\nawait delay(2000);\npm.info('Continuing execution...');"
  }
];

// Watch for prop changes
watch(() => props.script, (newScript) => {
  scriptEnabled.value = newScript.enabled;
  scriptContent.value = newScript.content;
}, { deep: true });

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
  });
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
        provideCompletionItems: (model: any, position: any) => {
          const suggestions = [
            {
              label: 'pm.environment',
              kind: (monaco.languages.CompletionItemKind as any).Module,
              insertText: 'pm.environment',
              detail: 'Environment variables API',
              documentation: 'Manage environment variables'
            },
            {
              label: 'pm.globals',
              kind: (monaco.languages.CompletionItemKind as any).Module,
              insertText: 'pm.globals',
              detail: 'Global variables API',
              documentation: 'Manage global variables'
            },
            {
              label: 'pm.request',
              kind: (monaco.languages.CompletionItemKind as any).Module,
              insertText: 'pm.request',
              detail: 'Request object API',
              documentation: 'Access and modify request data'
            },
            {
              label: 'pm.response',
              kind: (monaco.languages.CompletionItemKind as any).Module,
              insertText: 'pm.response',
              detail: 'Response object API',
              documentation: 'Access response data'
            },
            {
              label: 'pm.test',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.test("name", () => {\n  // test code\n});',
              detail: 'Define a test',
              documentation: 'Define a test case'
            },
            {
              label: 'pm.expect',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.expect(value)',
              detail: 'Assertion helper',
              documentation: 'Create an assertion'
            },
            {
              label: 'pm.info',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.info("message")',
              detail: 'Log info message',
              documentation: 'Log an informational message'
            },
            {
              label: 'pm.warn',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.warn("message")',
              detail: 'Log warning message',
              documentation: 'Log a warning message'
            },
            {
              label: 'pm.error',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.error("message")',
              detail: 'Log error message',
              documentation: 'Log an error message'
            },
            {
              label: 'pm.sendRequest',
              kind: (monaco.languages.CompletionItemKind as any).Function,
              insertText: 'pm.sendRequest("https://api.example.com", (err, res) => {\n  // handle response\n});',
              detail: 'Send an HTTP request',
              documentation: 'Send an HTTP request from scripts'
            },
            {
              label: 'pm.variables',
              kind: (monaco.languages.CompletionItemKind as any).Module,
              insertText: 'pm.variables',
              detail: 'Variables API',
              documentation: 'Access environment and global variables'
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

async function handleRunScript() {
  if (!scriptContent.value.trim()) {
    message.warning('Script is empty');
    return;
  }

  // Validate syntax first
  const syntaxCheck = validateScriptSyntax(scriptContent.value);
  if (!syntaxCheck.valid) {
    message.error(`Syntax error: ${syntaxCheck.error}`);
    logs.value = [{
      level: 'error',
      message: `Syntax error: ${syntaxCheck.error}`,
      timestamp: Date.now()
    }];
    return;
  }

  isRunning.value = true;
  logs.value = [];

  // Create script context
  const context: ScriptContext = {
    environment: { ...environmentStore.currentVariables },
    globals: environmentStore.globalVariables
      .filter(v => v.enabled)
      .reduce((acc, v) => ({ ...acc, [v.key]: v.value }), {}),
    request: props.request || {
      url: '',
      method: 'GET',
      headers: {}
    }
  };

  try {
    const result = await executeScript(scriptContent.value, context);

    logs.value = result.logs || [];

    if (result.success) {
      message.success('Script executed successfully');

      // Update environment if context was modified
      if (result.modifiedContext) {
        // Determine which variables are new/modified
        const currentEnvVars = environmentStore.currentEnvironment?.variables || [];
        const currentEnvVarKeys = new Set(currentEnvVars.map(v => v.key));

        // Update environment variables (add to current environment)
        Object.entries(result.modifiedContext.environment).forEach(([key, value]) => {
          if (environmentStore.currentEnvironment) {
            // Check if variable already exists in current environment
            const existingIndex = currentEnvVars.findIndex(v => v.key === key);
            if (existingIndex >= 0) {
              environmentStore.updateVariableInEnvironment(
                environmentStore.currentEnvironment.id,
                existingIndex,
                {
                  key,
                  value: String(value),
                  enabled: true
                }
              );
            } else {
              environmentStore.addVariableToEnvironment(
                environmentStore.currentEnvironment.id,
                {
                  key,
                  value: String(value),
                  enabled: true
                }
              );
            }
          } else {
            // No current environment, use local variables as fallback
            environmentStore.setLocalVariable(key, value);
          }
        });

        // Update global variables
        Object.entries(result.modifiedContext.globals).forEach(([key, value]) => {
          const existingIndex = environmentStore.globalVariables.findIndex(v => v.key === key);
          if (existingIndex >= 0) {
            environmentStore.updateGlobalVariable(existingIndex, {
              key,
              value: String(value),
              enabled: true
            });
          } else {
            environmentStore.addGlobalVariable({
              key,
              value: String(value),
              enabled: true
            });
          }
        });
      }

      emit('scriptExecuted', result);
    } else {
      message.error(`Script execution failed: ${result.error}`);
    }
  } catch (error) {
    message.error(`Script execution error: ${error}`);
    logs.value = [{
      level: 'error',
      message: `Script execution error: ${error}`,
      timestamp: Date.now()
    }];
  } finally {
    isRunning.value = false;
  }
}

function handleClearLogs() {
  logs.value = [];
  message.info('Logs cleared');
}

onMounted(() => {
  // Monaco Editor initialization is handled by the MonacoEditor component
});

onUnmounted(() => {
  if (editorInstance) {
    editorInstance.dispose();
  }
});
</script>

<style scoped>
.pre-request-script-tab {
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

.script-logs {
  border-top: 1px solid var(--n-border-color);
  flex-shrink: 0;
  max-height: 300px;
  overflow: hidden;
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

.snippet-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.snippet-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--n-text-color);
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
