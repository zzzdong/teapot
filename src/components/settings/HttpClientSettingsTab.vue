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

      <n-form-item label="CA证书路径" path="caCertPath">
        <n-input
          v-model:value="form.caCertPath"
          placeholder="可选，自定义CA证书文件路径"
          style="width: 300px;"
        />
        <template #feedback>
          <span class="form-hint">用于验证服务器证书的自定义CA证书（PEM格式）</span>
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
  type FormInst
} from 'naive-ui';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();
const formRef = ref<FormInst | null>(null);

// 表单数据，初始化为 store 中的值
const form = ref({ ...settingsStore.httpClient });

// 当 store 中的 httpClient 更新时，同步到表单（例如加载后）
watch(() => settingsStore.httpClient, (newVal) => {
  form.value = { ...newVal };
}, { deep: true });

// 表单变化时更新 store（使用防抖避免频繁更新）
let updateTimeout: ReturnType<typeof setTimeout> | null = null;
watch(form, (newVal) => {
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    settingsStore.updateHttpClient(newVal);
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