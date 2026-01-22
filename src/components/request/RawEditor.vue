<template>
  <div class="raw-editor">
    <div class="toolbar">
      <div class="type-selector">
        <n-radio-group
          :value="localRawType"
          @update:value="
            (val: RawBodyType) => {
              localRawType = val;
              emit('update:raw', content);
            }
          "
          size="small"
        >
          <n-space>
            <n-radio-button value="text">Text</n-radio-button>
            <n-radio-button value="json">JSON</n-radio-button>
            <n-radio-button value="xml">XML</n-radio-button>
            <n-radio-button value="html">HTML</n-radio-button>
            <n-radio-button value="javascript">JavaScript</n-radio-button>
          </n-space>
        </n-radio-group>
      </div>
      <div class="actions">
        <n-space>
          <n-button
            text
            @click="handleFormat"
            size="small"
          >
            <template #icon>
              <n-icon><FormatIcon /></n-icon>
            </template>
            Format
          </n-button>
          <n-button
            text
            @click="handleMinify"
            size="small"
          >
            <template #icon>
              <n-icon><CompressIcon /></n-icon>
            </template>
            Minify
          </n-button>
        </n-space>
      </div>
    </div>

    <div class="editor-container">
      <MonacoEditor
        v-model:value="content"
        :language="monacoLanguage"
        :options="editorOptions"
        height="100%"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NButton, NIcon, NRadioGroup, NRadioButton, NSpace, useMessage } from 'naive-ui';
import { CodeSlashOutline as FormatIcon, RemoveCircleOutline as CompressIcon } from '@vicons/ionicons5';
import type { RawBodyType } from '@/types/request';
import MonacoEditor from '@/components/common/MonacoEditor.vue';

interface Props {
  raw?: string;
  rawType?: RawBodyType;
}

interface Emits {
  (e: 'update:raw', raw: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();

const localRawType = ref<RawBodyType>(props.rawType || 'json');
const content = ref(props.raw || '');

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  automaticLayout: true,
  tabSize: 2,
};

const monacoLanguage = computed(() => {
  const typeMap: Record<RawBodyType, string> = {
    text: 'text',
    json: 'json',
    xml: 'xml',
    html: 'html',
    javascript: 'javascript',
  };
  return typeMap[localRawType.value] || 'text';
});

// Watch for prop changes
watch(
  () => props.raw,
  (newRaw) => {
    content.value = newRaw || '';
  }
);

watch(
  () => props.rawType,
  (newRawType) => {
    localRawType.value = newRawType || 'json';
  }
);

watch(content, (newContent) => {
  emit('update:raw', newContent);
});

function handleFormat() {
  if (localRawType.value === 'json') {
    try {
      const parsed = JSON.parse(content.value);
      content.value = JSON.stringify(parsed, null, 2);
      emit('update:raw', content.value);
    } catch (error) {
      message.error('Invalid JSON');
    }
  } else {
    message.info('Formatting only available for JSON');
  }
}

function handleMinify() {
  if (localRawType.value === 'json') {
    try {
      const parsed = JSON.parse(content.value);
      content.value = JSON.stringify(parsed);
      emit('update:raw', content.value);
    } catch (error) {
      message.error('Invalid JSON');
    }
  } else {
    message.info('Minifying only available for JSON');
  }
}
</script>

<style scoped>
.raw-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.type-selector {
  display: flex;
  align-items: center;
}

.editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
