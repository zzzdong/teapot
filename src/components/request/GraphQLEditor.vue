<template>
  <div class="graphql-editor">
    <div class="editor-label">Query</div>
    <n-input
      :value="query"
      type="textarea"
      placeholder="Enter GraphQL query"
      :autosize="{ minRows: 8 }"
      @update:value="handleQueryChange"
    />

    <div class="editor-label">Variables</div>
    <n-input
      :value="variables"
      type="textarea"
      placeholder='{"key": "value"}'
      :autosize="{ minRows: 4 }"
      @update:value="handleVariablesChange"
    />

    <div class="editor-actions">
      <n-space>
        <n-button
          text
          @click="handlePrettify"
        >
          <template #icon>
            <n-icon><FormatIcon /></n-icon>
          </template>
          Prettify
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NIcon, NInput, NSpace, useMessage } from 'naive-ui';
import { CodeSlashOutline as FormatIcon } from '@vicons/ionicons5';
import type { GraphQLQuery } from '@/types/request';

interface Props {
  graphql?: GraphQLQuery;
}

interface Emits {
  (e: 'update', graphql: GraphQLQuery): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();

const query = ref(props.graphql?.query || '');
const variables = ref(props.graphql?.variables || '');

// Watch for prop changes
watch(
  () => props.graphql,
  (newGraphql) => {
    if (newGraphql) {
      query.value = newGraphql.query || '';
      variables.value = newGraphql.variables || '';
    }
  },
  { deep: true }
);

function emitUpdate() {
  emit('update', {
    query: query.value,
    variables: variables.value,
  });
}

function handleQueryChange(value: string) {
  query.value = value;
  emitUpdate();
}

function handleVariablesChange(value: string) {
  variables.value = value;
  emitUpdate();
}

function handlePrettify() {
  if (variables.value) {
    try {
      const parsed = JSON.parse(variables.value);
      variables.value = JSON.stringify(parsed, null, 2);
      emitUpdate();
    } catch (error) {
      message.error('Invalid JSON in variables');
    }
  }
}
</script>

<style scoped>
.graphql-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.editor-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}
</style>
