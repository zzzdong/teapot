<template>
  <div class="raw-editor">
    <n-radio-group :value="localRawType" @update:value="(val: RawBodyType) => { localRawType = val; emit('update', content.value); }" size="small">
      <n-space>
        <n-radio-button value="text">Text</n-radio-button>
        <n-radio-button value="json">JSON</n-radio-button>
        <n-radio-button value="xml">XML</n-radio-button>
        <n-radio-button value="html">HTML</n-radio-button>
        <n-radio-button value="javascript">JavaScript</n-radio-button>
      </n-space>
    </n-radio-group>

    <div class="editor-container">
      <n-input
        :value="content"
        type="textarea"
        placeholder="Enter request body"
        :autosize="{ minRows: 10 }"
        @update:value="handleContentChange"
      />
    </div>

    <div class="editor-actions">
      <n-space>
        <n-button text @click="handleFormat">
          <template #icon>
            <n-icon><FormatIcon /></n-icon>
          </template>
          Format
        </n-button>
        <n-button text @click="handleMinify">
          <template #icon>
            <n-icon><CompressIcon /></n-icon>
          </template>
          Minify
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NButton, NIcon, NInput, NRadioGroup, NRadioButton, NSpace, useMessage } from 'naive-ui';
import { CodeSlashOutline as FormatIcon, RemoveCircleOutline as CompressIcon } from '@vicons/ionicons5';
import type { RawBodyType } from '@/types/request';

interface Props {
  raw?: string;
  rawType?: RawBodyType;
}

interface Emits {
  (e: 'update', raw: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();

const localRawType = ref<RawBodyType>(props.rawType || 'json');
const content = ref(props.raw || '');

// Watch for prop changes
watch(() => props.raw, (newRaw) => {
  content.value = newRaw || '';
});

watch(() => props.rawType, (newRawType) => {
  localRawType.value = newRawType || 'json';
});

watch([localRawType, content], ([newRawType, newContent]) => {
  emit('update', newContent);
});

function handleContentChange(value: string) {
  content.value = value;
  emit('update', value);
}

function handleFormat() {
  if (localRawType.value === 'json') {
    try {
      const parsed = JSON.parse(content.value);
      content.value = JSON.stringify(parsed, null, 2);
      handleContentChange(content.value);
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
      handleContentChange(content.value);
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

.editor-container {
  flex: 1;
  margin-top: 12px;
  min-height: 0;
  overflow: auto;
}

.editor-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}
</style>
