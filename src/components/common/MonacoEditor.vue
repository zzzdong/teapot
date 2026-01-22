<template>
  <div
    ref="editorRef"
    class="monaco-editor-container"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import loader from '@monaco-editor/loader';

// 配置 Monaco Editor Web Worker
// 使用 @monaco-editor/loader 处理 worker 加载
// loader 会自动检测本地安装的 monaco-editor 包

interface Props {
  value: string;
  language: string;
  theme?: string;
  options?: any;
  height?: string | number;
}

interface Emits {
  (e: 'update:value', value: string): void;
  (e: 'change', value: string): void;
  (e: 'ready', editor: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'vs',
  height: '100%',
});

const emit = defineEmits<Emits>();

const editorRef = ref<HTMLElement>();
let editorInstance: any = null;
let monaco: any = null;

async function initEditor() {
  if (!editorRef.value) return;

  try {
    // 使用 loader 加载 Monaco Editor
    monaco = await loader.init();

    // Create editor
    editorInstance = monaco.editor.create(editorRef.value, {
      value: props.value,
      language: props.language,
      theme: props.theme,
      ...props.options,
    });

    // Handle value changes
    editorInstance.onDidChangeModelContent(() => {
      const value = editorInstance?.getValue();
      if (value !== undefined) {
        emit('update:value', value);
        emit('change', value);
      }
    });

    // Emit ready event
    emit('ready', editorInstance);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      editorInstance?.layout();
    });

    if (editorRef.value.parentElement) {
      resizeObserver.observe(editorRef.value.parentElement);
    }

    // Store observer for cleanup
    (editorRef.value as any)._resizeObserver = resizeObserver;
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error);
  }
}

onMounted(() => {
  nextTick(() => {
    initEditor();
  });
});

// Clean up on unmount
onUnmounted(() => {
  if (editorRef.value && (editorRef.value as any)._resizeObserver) {
    (editorRef.value as any)._resizeObserver.disconnect();
  }
  if (editorInstance) {
    editorInstance.dispose();
  }
});

// Watch for value changes from parent
watch(
  () => props.value,
  (newValue) => {
    if (editorInstance && newValue !== editorInstance.getValue()) {
      const position = editorInstance.getPosition();
      editorInstance.setValue(newValue);
      if (position) {
        editorInstance.setPosition(position);
      }
    }
  }
);

// Watch for language changes
watch(
  () => props.language,
  (newLanguage) => {
    if (editorInstance && monaco) {
      const model = editorInstance.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
      }
    }
  }
);

// Watch for theme changes
watch(
  () => props.theme,
  (newTheme) => {
    if (monaco) {
      monaco.editor.setTheme(newTheme);
    }
  }
);

// Watch for options changes
watch(
  () => props.options,
  (newOptions) => {
    if (editorInstance) {
      editorInstance.updateOptions(newOptions);
    }
  },
  { deep: true }
);

// Expose editor methods
defineExpose({
  getEditor: () => editorInstance,
  getValue: () => editorInstance?.getValue(),
  setValue: (value: string) => editorInstance?.setValue(value),
  format: () => editorInstance?.getAction('editor.action.formatDocument')?.run(),
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.monaco-editor-container :deep(.monaco-editor) {
  width: 100% !important;
  height: 100% !important;
}
</style>
