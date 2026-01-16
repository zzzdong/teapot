<template>
  <div class="body-tab">
    <n-radio-group v-model:value="body.type" size="medium">
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
        <FormDataEditor v-model:form-data="body.formData" />
      </div>

      <!-- URL Encoded -->
      <div v-else-if="body.type === 'x-www-form-urlencoded'" class="urlencoded-body">
        <UrlEncodedEditor v-model:urlencoded="body.urlencoded" />
      </div>

      <!-- Raw -->
      <div v-else-if="body.type === 'raw'" class="raw-body">
        <RawEditor v-model:raw="body.raw" :raw-type="body.rawType" />
      </div>

      <!-- Binary -->
      <div v-else-if="body.type === 'binary'" class="binary-body">
        <BinaryEditor v-model:binary="body.binary" />
      </div>

      <!-- GraphQL -->
      <div v-else-if="body.type === 'graphql'" class="graphql-body">
        <GraphQLEditor v-model:graphql="body.graphql" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NRadioGroup, NRadioButton, NSpace } from 'naive-ui';
import type { RequestBody } from '@/types/request';
import FormDataEditor from './FormDataEditor.vue';
import UrlEncodedEditor from './UrlEncodedEditor.vue';
import RawEditor from './RawEditor.vue';
import BinaryEditor from './BinaryEditor.vue';
import GraphQLEditor from './GraphQLEditor.vue';

const body = defineModel<RequestBody>('body', {
  default: () => ({ type: 'none' })
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
