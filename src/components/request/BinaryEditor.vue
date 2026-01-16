<template>
  <div class="binary-editor">
    <div v-if="!file" class="upload-area" @click="handleSelectFile">
      <n-icon size="48" :color="'#999'">
        <CloudUploadIcon />
      </n-icon>
      <p class="upload-text">Click to select a file</p>
      <p class="upload-hint">Binary file upload</p>
    </div>
    <div v-else class="file-info">
      <n-icon size="48" :color="'#18a058'">
        <DocumentIcon />
      </n-icon>
      <p class="file-name">{{ file.name }}</p>
      <p class="file-size">{{ formatFileSize(file.size) }}</p>
      <n-button type="error" size="small" @click="handleClearFile">
        Clear File
      </n-button>
    </div>

    <input
      ref="fileInput"
      type="file"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NIcon } from 'naive-ui';
import { CloudUploadOutline as CloudUploadIcon, DocumentOutline as DocumentIcon } from '@vicons/ionicons5';

interface Props {
  binary?: File | null;
}

interface Emits {
  (e: 'update', binary: File | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(props.binary || null);

// Watch for prop changes
watch(() => props.binary, (newBinary) => {
  file.value = newBinary || null;
});

function handleSelectFile() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
    emit('update', file.value);
  }
}

function handleClearFile() {
  file.value = null;
  emit('update', null);
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
</script>

<style scoped>
.binary-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2px dashed var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: rgba(24, 160, 88, 0.05);
}

.upload-text {
  margin-top: 12px;
  font-size: 14px;
  color: #333;
}

.upload-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.file-name {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.file-size {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
</style>
