<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :style="{ width: '600px' }"
    title="Import"
  >
    <!-- 步骤指示器 -->
    <n-steps
      :current="currentStep"
      size="small"
      style="margin-bottom: 20px"
    >
      <n-step title="Input" />
      <n-step title="Preview" />
    </n-steps>

    <!-- 步骤1：输入选择 -->
    <template v-if="currentStep === 1">
      <div class="step-content">
        <n-tabs
          v-model:value="currentImportType"
          type="line"
          class="import-tabs"
        >
          <n-tab-pane
            name="file"
            tab="File"
          >
            <div class="tab-content">
              <div
                class="import-drop-area"
                @click="handleImportFile"
                @drop.prevent="handleDrop"
                @dragover.prevent
              >
                <div class="drop-icon">
                  <n-icon
                    size="48"
                    color="#999"
                  >
                    <AttachOutline />
                  </n-icon>
                </div>
                <div class="drop-text">Drop file here or click to select</div>
                <div class="drop-subtitle">Supported: Teapot JSON, Postman Collection v2.1</div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane
            name="text"
            tab="Text"
          >
            <div class="tab-content">
              <div class="text-editor-wrapper">
                <MonacoEditor
                  v-model:value="textContent"
                  language="text"
                  :min-lines="15"
                  :max-lines="15"
                />
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>

        <n-space
          justify="end"
          style="margin-top: 20px"
        >
          <n-button @click="closeModal">Cancel</n-button>
          <n-button
            type="primary"
            :disabled="!canProceedToPreview"
            @click="handleNextStep"
          >
            Next
          </n-button>
        </n-space>
      </div>
    </template>

    <!-- 步骤2：预览确认 -->
    <template v-else-if="currentStep === 2">
      <div class="step-content">
        <div class="preview-container">
          <n-scrollbar
            style="max-height: 400px"
            v-if="importPreview"
          >
            <n-descriptions
              bordered
              :column="1"
              label-placement="left"
            >
              <n-descriptions-item label="Import Type">
                <n-tag>{{ importPreview.type }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item
                label="Items Count"
                v-if="importPreview.itemCount"
              >
                {{ importPreview.itemCount }}
              </n-descriptions-item>
              <n-descriptions-item label="Preview">
                <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word"
                  >{{ JSON.stringify(importPreview.data, null, 2) }}
                </pre>
              </n-descriptions-item>
            </n-descriptions>
          </n-scrollbar>
          <div
            v-else
            class="empty-preview"
          >
            No data to preview
          </div>
        </div>

        <n-space
          justify="end"
          style="margin-top: 20px"
        >
          <n-button @click="handlePrevStep">Back</n-button>
          <n-button
            type="primary"
            @click="handleImport"
            :disabled="!importPreview"
          >
            Import
          </n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NModal,
  NSpace,
  NButton,
  NTabs,
  NTabPane,
  NSteps,
  NStep,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NScrollbar,
  NIcon,
  useMessage,
} from 'naive-ui';
import { AttachOutline } from '@vicons/ionicons5';
import MonacoEditor from '@/components/common/MonacoEditor.vue';
import { curlToRequest } from '@/utils/curlParser';
import { convertPostmanToTeapot, isPostmanCollection, isTeapotFormat } from '@/utils/postmanParser';
import { useWorkspaceStore } from '@/stores/workspace';
import { useEnvironmentStore } from '@/stores/environment';
import { useCollectionsStore } from '@/stores/collections';
import type { Request } from '@/types/request';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();
const workspaceStore = useWorkspaceStore();
const environmentStore = useEnvironmentStore();
const collectionsStore = useCollectionsStore();

// 步骤控制
const currentStep = ref(1);
const currentImportType = ref<'file' | 'text'>('file');
const textContent = ref('');
const fileSourceType = ref<'teapot' | 'postman' | 'unknown'>('unknown');
const importPreview = ref<{
  type: string;
  data: any;
  itemCount?: number;
} | null>(null);

// 文件数据
const selectedFile = ref<File | null>(null);
const selectedFileContent = ref<string>('');

// 使用计算属性来控制模态框的显示状态
const showModal = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
    if (!value) {
      // 重置状态
      resetForm();
    }
  },
});

// 是否可以进入下一步
const canProceedToPreview = computed(() => {
  if (currentImportType.value === 'file') {
    return !!selectedFile.value;
  } else {
    return textContent.value.trim().length > 0;
  }
});

// 重置表单
const resetForm = () => {
  currentStep.value = 1;
  currentImportType.value = 'file';
  fileSourceType.value = 'unknown';
  textContent.value = '';
  importPreview.value = null;
  selectedFile.value = null;
  selectedFileContent.value = '';
};

// 关闭模态框
const closeModal = () => {
  showModal.value = false;
};

// 拖放处理
const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
    // 读取文件内容
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedFileContent.value = e.target?.result as string;
    };
    reader.readAsText(files[0]);
  }
};

// 处理文件选择
const handleImportFile = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) {
      selectedFile.value = file;
      selectedFileContent.value = await file.text();
    }
  };
  input.click();
};

// 下一步
const handleNextStep = async () => {
  try {
    if (currentImportType.value === 'file' && selectedFile.value) {
      // 解析文件
      const data = JSON.parse(selectedFileContent.value);

      // 检测文件类型
      if (isTeapotFormat(data)) {
        fileSourceType.value = 'teapot';
        importPreview.value = {
          type: 'Teapot JSON',
          data: data,
          itemCount: (data.collections?.length || 0) + (data.environments?.length || 0),
        };
      } else if (isPostmanCollection(data)) {
        fileSourceType.value = 'postman';
        const converted = convertPostmanToTeapot(data);
        importPreview.value = {
          type: 'Postman Collection',
          data: converted,
          itemCount: (converted.collections?.length || 0) + (converted.environments?.length || 0),
        };
      } else {
        throw new Error('Unsupported file format. Please use Teapot JSON or Postman Collection v2.1');
      }
    } else if (currentImportType.value === 'text') {
      // 解析文本（cURL）
      const request = curlToRequest(textContent.value);
      if (!request) {
        throw new Error('Failed to parse cURL command');
      }
      importPreview.value = {
        type: 'cURL',
        data: request,
        itemCount: 1,
      };
    }
    currentStep.value = 2;
  } catch (error) {
    message.error('Failed to parse input: ' + (error as Error).message);
  }
};

// 上一步
const handlePrevStep = () => {
  currentStep.value = 1;
};

// 执行导入
const handleImport = async () => {
  if (!importPreview.value) return;

  try {
    if (currentImportType.value === 'file' && selectedFile.value) {
      // 文件导入
      const data = importPreview.value.data;

      if (fileSourceType.value === 'teapot') {
        // 导入 Teapot 格式
        // 导入环境
        if (data.environments) {
          data.environments.forEach((env: any) => {
            environmentStore.importEnvironment(env);
          });
          if (data.currentEnvironmentId) {
            environmentStore.setCurrentEnvironment(data.currentEnvironmentId);
          }
        }

        // 导入请求
        if (data.collections) {
          data.collections.forEach((collection: any) => {
            collectionsStore.importCollection(collection);
          });
        }
      } else if (fileSourceType.value === 'postman') {
        // 导入 Postman 格式
        // 导入环境
        if (data.environments) {
          data.environments.forEach((env: any) => {
            environmentStore.importEnvironment(env);
          });
        }

        // 导入请求
        if (data.collections) {
          data.collections.forEach((collection: any) => {
            collectionsStore.importCollection(collection);
          });
        }
      }

      message.success(`Successfully imported ${importPreview.value.itemCount || 0} items`);
    } else if (currentImportType.value === 'text') {
      // cURL导入
      const request = importPreview.value.data as Request;

      workspaceStore.loadRequestIntoNewTab(request);
      message.success('cURL import successful');
    }

    // 关闭模态框
    closeModal();
  } catch (error) {
    message.error('Import failed: ' + (error as Error).message);
    console.error('Import error:', error);
  }
};
</script>

<style scoped>
/* 步骤内容容器 */
.step-content {
  min-height: 380px;
}

/* Tab 容器 - 确保高度一致 */
.import-tabs {
  min-height: 340px;
}

.tab-content {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

/* 文件拖放区域 */
.import-drop-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.import-drop-area:hover {
  border-color: #1890ff;
}

.drop-icon {
  margin-bottom: 16px;
}

.drop-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.drop-subtitle {
  font-size: 14px;
  color: #999;
}

/* 文本编辑器容器 */
.text-editor-wrapper {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

/* 预览区域 */
.preview-container {
  max-height: 340px;
  overflow: auto;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 340px;
  color: #999;
  font-size: 14px;
}

.text-import-container {
  margin-bottom: 16px;
}
</style>
