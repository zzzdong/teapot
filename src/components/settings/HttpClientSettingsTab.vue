<template>
  <div class="http-client-settings">
    <n-form
      ref="formRef"
      :model="form"
      label-placement="left"
      label-width="auto"
      size="medium"
      style="max-height: 500px; overflow-y: auto; padding-right: 8px;"
    >
      <n-form-item label="SSL证书验证" path="verifySsl">
        <n-switch v-model:value="form.verifySsl" />
        <template #feedback>
          <span class="form-hint">启用后，将验证服务器的SSL证书</span>
        </template>
      </n-form-item>

      <n-form-item label="默认超时时间 (ms)" path="defaultTimeout">
        <n-input-number
          v-model:value="form.defaultTimeout"
          :min="100"
          :step="1000"
          style="width: 200px;"
        />
        <template #feedback>
          <span class="form-hint">HTTP请求的默认超时时间，单位毫秒</span>
        </template>
      </n-form-item>

      <n-form-item label="默认User-Agent" path="defaultUserAgent">
        <n-input
          v-model:value="form.defaultUserAgent"
          placeholder="例如: Teapot/1.0"
          style="width: 300px;"
        />
        <template #feedback>
          <span class="form-hint">发送HTTP请求时使用的默认User-Agent头</span>
        </template>
      </n-form-item>

      <n-form-item label="自动跟随重定向" path="followRedirects">
        <n-switch v-model:value="form.followRedirects" />
        <template #feedback>
          <span class="form-hint">启用后，自动跟随HTTP重定向（最多10次）</span>
        </template>
      </n-form-item>

      <n-form-item label="CA证书路径" path="caCertPaths">
        <div v-if="form.caCertPaths && form.caCertPaths.length > 0">
          <div v-for="(path, index) in form.caCertPaths" :key="index" class="cert-path-item">
            <n-input
              v-model:value="form.caCertPaths[index]"
              placeholder="自定义CA证书文件路径"
              style="width: 300px;"
            />
            <n-button
              type="primary"
              size="small"
              @click="selectCertPath(index)"
              style="margin-left: 8px;"
            >
              选择
            </n-button>
            <n-button
              type="error"
              size="small"
              @click="removeCertPath(index)"
              style="margin-left: 8px;"
            >
              删除
            </n-button>
          </div>
        </div>
        <n-button
          type="primary"
          size="small"
          @click="addCertPath"
          style="margin-top: 8px;"
        >
          添加CA证书路径
        </n-button>
        <template #feedback>
          <span class="form-hint">用于验证服务器证书的自定义CA证书（PEM格式），可添加多个</span>
        </template>
      </n-form-item>

      <n-divider title-placement="left">代理设置</n-divider>

      <n-form-item label="启用代理" path="proxy.enabled">
        <n-switch v-model:value="form.proxy.enabled" />
      </n-form-item>

      <n-form-item v-if="form.proxy.enabled" label="代理主机" path="proxy.host">
        <n-input v-model:value="form.proxy.host" placeholder="例如: 127.0.0.1" style="width: 200px;" />
      </n-form-item>

      <n-form-item v-if="form.proxy.enabled" label="代理端口" path="proxy.port">
        <n-input-number
          v-model:value="form.proxy.port"
          :min="1"
          :max="65535"
          style="width: 150px;"
        />
      </n-form-item>

      <n-form-item v-if="form.proxy.enabled" label="代理协议" path="proxy.protocol">
        <n-radio-group v-model:value="form.proxy.protocol">
          <n-radio value="http">HTTP</n-radio>
          <n-radio value="https">HTTPS</n-radio>
          <n-radio value="socks5">SOCKS5</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item v-if="form.proxy.enabled" label="用户名" path="proxy.username">
        <n-input v-model:value="form.proxy.username" style="width: 200px;" />
      </n-form-item>

      <n-form-item v-if="form.proxy.enabled" label="密码" path="proxy.password">
        <n-input
          v-model:value="form.proxy.password"
          type="password"
          show-password-on="mousedown"
          style="width: 200px;"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NForm,
  NFormItem,
  NSwitch,
  NInput,
  NInputNumber,
  NDivider,
  NRadioGroup,
  NRadio,
  NButton,
  type FormInst
} from 'naive-ui';
import { useSettingsStore } from '@/stores/settings';
import { open } from '@tauri-apps/plugin-dialog';

const settingsStore = useSettingsStore();
const formRef = ref<FormInst | null>(null);

// 表单数据，初始化为 store 中的值
const form = ref({ ...settingsStore.httpClient });

// 确保 caCertPaths 是数组
if (!Array.isArray(form.value.caCertPaths)) {
  form.value.caCertPaths = [];
}

// 确保 proxy 对象存在（提供默认值）
if (!form.value.proxy) {
  form.value.proxy = {
    enabled: false,
    host: '',
    port: 8080,
    protocol: 'http',
    username: undefined,
    password: undefined
  };
}

// 添加CA证书路径
function addCertPath() {
  if (!Array.isArray(form.value.caCertPaths)) {
    form.value.caCertPaths = [];
  }
  form.value.caCertPaths.push('');
}

// 选择CA证书文件
async function selectCertPath(index: number) {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'PEM 证书',
          extensions: ['pem', 'crt', 'cer']
        },
        {
          name: '所有文件',
          extensions: ['*']
        }
      ]
    });

    if (selected && typeof selected === 'string') {
      if (!Array.isArray(form.value.caCertPaths)) {
        form.value.caCertPaths = [];
      }
      form.value.caCertPaths[index] = selected;
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error);
  }
}

// 移除CA证书路径
function removeCertPath(index: number) {
  if (Array.isArray(form.value.caCertPaths)) {
    form.value.caCertPaths.splice(index, 1);
  }
}

// 当 store 中的 httpClient 更新时，同步到表单（例如加载后）
watch(() => settingsStore.httpClient, (newVal) => {
  const synced = { ...newVal };
  // 确保 proxy 对象存在
  if (!synced.proxy) {
    synced.proxy = {
      enabled: false,
      host: '',
      port: 8080,
      protocol: 'http',
      username: undefined,
      password: undefined
    };
  }
  form.value = synced;
}, { deep: true });

// 表单变化时更新 store（使用防抖避免频繁更新）
let updateTimeout: ReturnType<typeof setTimeout> | null = null;
watch(form, async (newVal) => {
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = setTimeout(async () => {
    // 更新前端 store
    settingsStore.updateHttpClient(newVal);
    // 持久化到 Tauri store
    await settingsStore.save();
    // 更新后端配置
    await import('@/api/tauri-api').then(api => api.httpClient.updateConfig(newVal));
  }, 300);
}, { deep: true });
</script>

<style scoped>
.http-client-settings {
  padding: 8px 0;
}
.form-hint {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}
</style>