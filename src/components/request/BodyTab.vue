<template>
  <div class="body-tab">
    <n-radio-group v-model:value="bodyType" size="medium">
      <n-space>
        <n-radio-button value="none">None</n-radio-button>
        <n-radio-button value="form-data">Form Data</n-radio-button>
        <n-radio-button value="x-www-form-urlencoded">x-www-form-urlencoded</n-radio-button>
        <n-radio-button value="raw">Raw</n-radio-button>
        <n-radio-button value="binary">Binary</n-radio-button>
        <n-radio-button value="graphql">GraphQL</n-radio-button>
      </n-space>
    </n-radio-group>

    <div class="body-content">
      <!-- None -->
      <div v-if="body.type === 'none'" class="empty-body">
        <p>This request does not have a body.</p>
      </div>

      <!-- Form Data -->
      <div v-else-if="body.type === 'form-data'" class="form-data-body">
        <FormDataEditor v-model:form-data="localFormData" />
      </div>

      <!-- URL Encoded -->
      <div v-else-if="body.type === 'x-www-form-urlencoded'" class="urlencoded-body">
        <UrlEncodedEditor v-model:urlencoded="localUrlencoded" />
      </div>

      <!-- Raw -->
      <div v-else-if="body.type === 'raw'" class="raw-body">
        <RawEditor v-model:raw="localRaw" :raw-type="body.rawType || 'text'" @update:raw-type="handleRawTypeUpdate" />
      </div>

      <!-- Binary -->
      <div v-else-if="body.type === 'binary'" class="binary-body">
        <BinaryEditor v-model:binary="localBinary" />
      </div>

      <!-- GraphQL -->
      <div v-else-if="body.type === 'graphql'" class="graphql-body">
        <GraphQLEditor v-model:graphql="localGraphQL" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NRadioGroup, NRadioButton, NSpace } from 'naive-ui';
import type { RequestBody, RawBodyType } from '@/types/request';
import FormDataEditor from './FormDataEditor.vue';
import UrlEncodedEditor from './UrlEncodedEditor.vue';
import RawEditor from './RawEditor.vue';
import BinaryEditor from './BinaryEditor.vue';
import GraphQLEditor from './GraphQLEditor.vue';

const body = defineModel<RequestBody>('body', {
  default: () => ({ type: 'none' })
});

// 使用 computed 创建响应式引用，直接修改会触发 defineModel 的更新
const bodyType = computed({
  get: () => body.value.type,
  set: (type: string) => {
    body.value = {
      ...body.value,
      type: type as RequestBody['type']
    };
  }
});

const localFormData = computed({
  get: () => body.value.formData || [],
  set: (value: any[]) => {
    body.value = {
      ...body.value,
      type: 'form-data',
      formData: value
    };
  }
});

const localUrlencoded = computed({
  get: () => body.value.urlencoded || [],
  set: (value: any[]) => {
    body.value = {
      ...body.value,
      type: 'x-www-form-urlencoded',
      urlencoded: value
    };
  }
});

const localRaw = computed({
  get: () => body.value.raw || '',
  set: (value: string) => {
    body.value = {
      ...body.value,
      type: 'raw',
      raw: value
    };
  }
});

function handleRawTypeUpdate(rawType: RawBodyType) {
  body.value = {
    ...body.value,
    type: 'raw',
    rawType
  };
}

const localBinary = computed({
  get: () => body.value.binary || null,
  set: (value: any) => {
    body.value = {
      ...body.value,
      type: 'binary',
      binary: value
    };
  }
});

const localGraphQL = computed({
  get: () => body.value.graphql || { query: '', variables: '' },
  set: (value: any) => {
    body.value = {
      ...body.value,
      type: 'graphql',
      graphql: value
    };
  }
});
</script>

<style scoped>
.body-tab {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.body-content {
  flex: 1;
  margin-top: 16px;
  min-height: 0;
  overflow: auto;
  flex-shrink: 0;
}

.empty-body {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.form-data-body,
.urlencoded-body,
.raw-body,
.binary-body,
.graphql-body {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
