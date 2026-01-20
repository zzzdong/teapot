<template>
  <n-modal 
    v-model:show="showModal" 
    preset="card" 
    :style="{ width: '600px' }" 
    :title="modalTitle"
  >
    <template v-if="currentImportType === null">
      <n-space vertical size="large">
        <div>Select import type:</div>
        <n-button size="large" block @click="handleImportTeapot">
          <template #icon>
            <n-icon>
              <DownloadOutline />
            </n-icon>
          </template>
          Teapot JSON
        </n-button>
        <n-button size="large" block @click="selectCurlImport">
          <template #icon>
            <n-icon>
              <CodeSlashOutline />
            </n-icon>
          </template>
          cURL Command
        </n-button>
      </n-space>
    </template>

    <template v-else-if="currentImportType === 'curl'">
      <n-space vertical>
        <div>Paste your cURL command below:</div>
        <div style="height: 300px; border: 1px solid var(--border-color); border-radius: 4px;">
          <MonacoEditor
            v-model:value="curlContent"
            language="shell"
            :min-lines="12"
            :max-lines="20"
          />
        </div>
        <n-space justify="end">
          <n-button @click="backToSelection">Back</n-button>
          <n-button type="primary" @click="handleImportCurl">Import</n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { NModal, NSpace, NButton, useMessage } from 'naive-ui'
import { DownloadOutline, CodeSlashOutline } from '@vicons/ionicons5'
import MonacoEditor from '@/components/common/MonacoEditor.vue'
import { parseCurlCommand, parsedCurlToRequest } from '@/utils/curlParser'
import { useWorkspaceStore } from '@/stores/workspace'
import { useEnvironmentStore } from '@/stores/environment'
import { useCollectionsStore } from '@/stores/collections'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()
const workspaceStore = useWorkspaceStore()
const environmentStore = useEnvironmentStore()
const collectionsStore = useCollectionsStore()

// 使用计算属性来控制模态框的显示状态
const showModal = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
    if (!value) {
      // 重置状态
      currentImportType.value = null
      curlContent.value = '' // 清空cURL内容
    }
  }
})

const currentImportType = ref<string | null>(null)
const curlContent = ref('') // 初始化为空字符串

const modalTitle = computed(() => {
  if (currentImportType.value === null) {
    return 'Import'
  } else if (currentImportType.value === 'teapot') {
    return 'Import Teapot JSON'
  } else if (currentImportType.value === 'curl') {
    return 'Import cURL Command'
  }
  return 'Import'
})

const selectCurlImport = () => {
  currentImportType.value = 'curl'
  // 确保在DOM更新后再聚焦编辑器
  nextTick(() => {
    // 初始化时可以设置一些默认内容或焦点
  })
}

const backToSelection = () => {
  currentImportType.value = null
  curlContent.value = ''
}

const handleImportTeapot = () => {
  // 触发文件选择对话框
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) {
      const content = await file.text();
      try {
        const data = JSON.parse(content);
        
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
        
        message.success('Import successful');
        // 关闭模态框
        showModal.value = false;
      } catch (error) {
        message.error('Invalid file format');
      }
    }
  };
  input.click();
}

const handleImportCurl = () => {
  // 解析 cURL 命令
  if (!curlContent.value.trim()) {
    message.error('cURL command is empty');
    return;
  }

  try {
    const parsed = parseCurlCommand(curlContent.value);
    if (!parsed) {
      message.error('Failed to parse cURL command');
      return;
    }

    const convertedRequest = parsedCurlToRequest(parsed);
    
    const request = {
      id: Date.now().toString(),
      name: `Imported from cURL: ${parsed.url || 'Unknown'}`,
      method: convertedRequest.method,
      url: convertedRequest.url,
      headers: convertedRequest.headers,
      body: convertedRequest.body,
      params: [],
      auth: {
        type: 'noauth',
        config: {}
      },
      preRequestScript: {
        enabled: false,
        content: ''
      },
      testScript: {
        enabled: false,
        content: ''
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    workspaceStore.loadRequestIntoNewTab(request);
    message.success('cURL import successful');
    // 关闭模态框
    showModal.value = false;
  } catch (error) {
    message.error('Failed to parse cURL command');
    console.error('Parse cURL error:', error);
  }
}
</script>