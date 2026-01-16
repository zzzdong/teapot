<template>
  <div class="response-body">
    <div class="body-header">
      <n-radio-group v-model:value="viewType" size="small">
        <n-space>
          <n-radio-button value="pretty">Pretty</n-radio-button>
          <n-radio-button value="raw">Raw</n-radio-button>
          <n-radio-button value="preview">Preview</n-radio-button>
        </n-space>
      </n-radio-group>
    </div>

    <div class="body-content">
      <!-- Pretty View -->
      <div v-if="viewType === 'pretty'" class="pretty-view">
        <div v-if="isJson" class="code-viewer">
          <MonacoEditor
            :value="formattedJson"
            language="json"
            theme="vs"
            :options="editorOptions"
            height="100%"
          />
        </div>
        <div v-else-if="isXml" class="code-viewer">
          <MonacoEditor
            :value="formattedXml"
            language="xml"
            theme="vs"
            :options="editorOptions"
            height="100%"
          />
        </div>
        <div v-else class="text-viewer">
          <MonacoEditor
            :value="bodyText"
            language="plaintext"
            theme="vs"
            :options="editorOptions"
            height="100%"
          />
        </div>
      </div>

      <!-- Raw View -->
      <div v-else-if="viewType === 'raw'" class="raw-view">
        <MonacoEditor
          :value="bodyText"
          language="plaintext"
          theme="vs"
          :options="editorOptions"
          height="100%"
        />
      </div>

      <!-- Preview View -->
      <div v-else-if="viewType === 'preview'" class="preview-view">
        <iframe
          v-if="isHtml"
          :srcdoc="bodyText"
          class="html-preview"
          sandbox="allow-same-origin"
        />
        <div v-else-if="isImage" class="image-preview">
          <img :src="imageSrc" alt="Response preview" />
        </div>
        <div v-else class="no-preview">
          <p>Preview not available for this content type</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NInput, NRadioGroup, NRadioButton, NSpace } from 'naive-ui';
import MonacoEditor from '@/components/common/MonacoEditor.vue';
import { useResponseStore } from '@/stores/response';

const responseStore = useResponseStore();

// Monaco Editor options - readonly with light theme
const editorOptions = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: 'on',
  lineNumbers: 'on',
  fontSize: 13,
  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
  padding: { top: 16, bottom: 16 },
  renderLineHighlight: 'none',
  occurrencesHighlight: false,
  renderWhitespace: 'none',
  scrollbar: {
    useShadows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10
  }
};

const viewType = computed({
  get: () => responseStore.viewType,
  set: (value) => responseStore.setViewType(value)
});

const bodyText = computed(() => {
  if (typeof responseStore.body === 'string') {
    return responseStore.body;
  }
  return JSON.stringify(responseStore.body, null, 2);
});

const contentType = computed(() => {
  const header = responseStore.headers['content-type'] || '';
  return header.toLowerCase().split(';')[0];
});

const isJson = computed(() => {
  return contentType.value === 'application/json' || contentType.value === 'application/vnd.api+json';
});

const isXml = computed(() => {
  return contentType.value === 'application/xml' ||
         contentType.value === 'text/xml' ||
         contentType.value === 'application/atom+xml';
});

const isHtml = computed(() => {
  return contentType.value === 'text/html' || contentType.value === 'application/xhtml+xml';
});

const isImage = computed(() => {
  return contentType.value.startsWith('image/');
});

const formattedJson = computed(() => {
  if (typeof responseStore.body === 'string') {
    try {
      return JSON.stringify(JSON.parse(responseStore.body), null, 2);
    } catch {
      return responseStore.body;
    }
  }
  return JSON.stringify(responseStore.body, null, 2);
});

const formattedXml = computed(() => {
  // Simple XML formatting - could use a proper XML formatter library
  return bodyText.value;
});

const imageSrc = computed(() => {
  if (typeof responseStore.body === 'string' && responseStore.body.startsWith('data:')) {
    return responseStore.body;
  }
  return '';
});
</script>

<style scoped>
.response-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 0;
}

.body-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.body-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pretty-view,
.raw-view,
.preview-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.code-viewer,
.text-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

:deep(.code-viewer .monaco-editor),
:deep(.text-viewer .monaco-editor) {
  flex: 1;
}

:deep(.code-viewer .monaco-editor-container),
:deep(.text-viewer .monaco-editor-container) {
  flex: 1;
}

:deep(.monaco-editor .margin) {
  background-color: #f5f5f5;
}

:deep(.monaco-editor .line-numbers) {
  color: #999;
}

:deep(.monaco-editor .current-line) {
  border: none;
  background: #f0f0f0;
}

.html-preview {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.image-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: auto;
}

.image-preview img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.no-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #999;
}
</style>
