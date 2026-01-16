<template>
  <div class="auth-tab">
    <n-select
      :value="authType"
      :options="authOptions"
      placeholder="Select Auth Type"
      @update:value="handleAuthTypeChange"
    />

    <div class="auth-content">
      <!-- No Auth -->
      <div v-if="authType === 'noauth'" class="no-auth">
        <p>This request does not use any authentication.</p>
      </div>

      <!-- Bearer Token -->
      <div v-else-if="authType === 'bearer'" class="bearer-auth">
        <n-form-item label="Token">
          <n-input
            v-model:value="bearerToken"
            type="password"
            placeholder="Enter bearer token"
            show-password-on="click"
            @update:value="handleBearerTokenChange"
          />
        </n-form-item>
        <n-form-item label="Prefix">
          <n-input
            v-model:value="bearerPrefix"
            placeholder="Bearer"
            @update:value="handleBearerPrefixChange"
          />
        </n-form-item>
      </div>

      <!-- Basic Auth -->
      <div v-else-if="authType === 'basic'" class="basic-auth">
        <n-form-item label="Username">
          <n-input
            v-model:value="basicUsername"
            placeholder="Enter username"
            @update:value="handleBasicUsernameChange"
          />
        </n-form-item>
        <n-form-item label="Password">
          <n-input
            v-model:value="basicPassword"
            type="password"
            placeholder="Enter password"
            show-password-on="click"
            @update:value="handleBasicPasswordChange"
          />
        </n-form-item>
      </div>

      <!-- API Key -->
      <div v-else-if="authType === 'apikey'" class="apikey-auth">
        <n-form-item label="Key">
          <n-input
            v-model:value="apiKeyKey"
            placeholder="Enter key name"
            @update:value="handleApiKeyKeyChange"
          />
        </n-form-item>
        <n-form-item label="Value">
          <n-input
            v-model:value="apiKeyValue"
            type="password"
            placeholder="Enter key value"
            show-password-on="click"
            @update:value="handleApiKeyValueChange"
          />
        </n-form-item>
        <n-form-item label="Add to">
          <n-radio-group v-model:value="apiKeyAddTo" @update:value="handleApiKeyAddToChange">
            <n-space>
              <n-radio value="header">Header</n-radio>
              <n-radio value="query">Query Params</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
      </div>

      <!-- Other Auth Types -->
      <div v-else class="coming-soon">
        <p>{{ authType }} authentication coming soon.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NFormItem, NInput, NSelect, NRadio, NRadioGroup, NSpace } from 'naive-ui';
import type { AuthConfig } from '@/types/request';

interface Props {
  auth: AuthConfig;
}

interface Emits {
  (e: 'update', auth: AuthConfig): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authOptions = [
  { label: 'No Auth', value: 'noauth' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'Basic Auth', value: 'basic' },
  { label: 'API Key', value: 'apikey' },
  { label: 'Digest Auth', value: 'digest' },
  { label: 'OAuth 1.0', value: 'oauth1' },
  { label: 'OAuth 2.0', value: 'oauth2' },
  { label: 'AWS Signature', value: 'aws4' }
];

const authType = computed(() => props.auth.type);

// Bearer Token
const bearerToken = ref(props.auth.config.token || '');
const bearerPrefix = ref(props.auth.config.prefix || 'Bearer');

// Basic Auth
const basicUsername = ref(props.auth.config.username || '');
const basicPassword = ref(props.auth.config.password || '');

// API Key
const apiKeyKey = ref(props.auth.config.key || '');
const apiKeyValue = ref(props.auth.config.value || '');
const apiKeyAddTo = ref<'header' | 'query'>(props.auth.config.addTo || 'header');

// Watch for prop changes
watch(() => props.auth, (newAuth) => {
  bearerToken.value = newAuth.config.token || '';
  bearerPrefix.value = newAuth.config.prefix || 'Bearer';
  basicUsername.value = newAuth.config.username || '';
  basicPassword.value = newAuth.config.password || '';
  apiKeyKey.value = newAuth.config.key || '';
  apiKeyValue.value = newAuth.config.value || '';
  apiKeyAddTo.value = newAuth.config.addTo || 'header';
}, { deep: true });

function handleAuthTypeChange(type: AuthConfig['type']) {
  updateAuth();
}

function handleBearerTokenChange(value: string) {
  bearerToken.value = value;
  updateAuth();
}

function handleBearerPrefixChange(value: string) {
  bearerPrefix.value = value;
  updateAuth();
}

function handleBasicUsernameChange(value: string) {
  basicUsername.value = value;
  updateAuth();
}

function handleBasicPasswordChange(value: string) {
  basicPassword.value = value;
  updateAuth();
}

function handleApiKeyKeyChange(value: string) {
  apiKeyKey.value = value;
  updateAuth();
}

function handleApiKeyValueChange(value: string) {
  apiKeyValue.value = value;
  updateAuth();
}

function handleApiKeyAddToChange(value: 'header' | 'query') {
  apiKeyAddTo.value = value;
  updateAuth();
}

function updateAuth() {
  const config: Record<string, any> = {};

  if (authType.value === 'bearer') {
    config.token = bearerToken.value;
    config.prefix = bearerPrefix.value;
  } else if (authType.value === 'basic') {
    config.username = basicUsername.value;
    config.password = basicPassword.value;
  } else if (authType.value === 'apikey') {
    config.key = apiKeyKey.value;
    config.value = apiKeyValue.value;
    config.addTo = apiKeyAddTo.value;
  }

  emit('update', {
    type: authType.value,
    config
  });
}
</script>

<style scoped>
.auth-tab {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.auth-content {
  margin-top: 16px;
  flex-shrink: 0;
}

.no-auth,
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}
</style>
