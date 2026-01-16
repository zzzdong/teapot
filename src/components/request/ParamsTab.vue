<template>
  <div class="params-tab">
    <n-data-table
      :row-key="getRowKey"
      :columns="columns"
      :data="params"
      :pagination="false"
      :bordered="false"
      size="small"
    />
    <n-button
      text
      type="primary"
      class="add-button"
      @click="handleAddParam"
    >
      + Add Parameter
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch } from 'vue';
import { NButton, NCheckbox, NInput, NDataTable, NIcon } from 'naive-ui';
import { AddOutline as AddIcon, TrashOutline as TrashIcon } from '@vicons/ionicons5';
import type { RequestParam } from '@/types/request';

const params = defineModel<RequestParam[]>('params', { default: () => [] });

// Use WeakMap to assign a unique key to each row object
// This avoids re-rendering the entire row when content changes
const rowKeySet = new WeakMap<RequestParam, number>();
let keyCounter = 0;

const getRowKey = (row: RequestParam): string => {
  if (!rowKeySet.has(row)) {
    rowKeySet.set(row, ++keyCounter);
  }
  return `param-${rowKeySet.get(row)}`;
};

// Debounce emit to avoid excessive re-renders
let emitTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedEmit() {
  if (emitTimer) clearTimeout(emitTimer);
  emitTimer = setTimeout(() => {
    params.value = [...params.value];
  }, 300);
}

const columns = [
  {
    title: '',
    key: 'enabled',
    width: 50,
    render: (row: RequestParam, index: number) =>
      h(NCheckbox, {
        checked: row.enabled,
        'onUpdate:checked': (checked: boolean) => {
          row.enabled = checked;
          debouncedEmit();
        }
      })
  },
  {
    title: 'Key',
    key: 'key',
    render: (row: RequestParam, index: number) =>
      h(NInput, {
        value: row.key,
        placeholder: 'Key',
        size: 'small',
        'onUpdate:value': (value: string) => {
          row.key = value;
          debouncedEmit();
        }
      })
  },
  {
    title: 'Value',
    key: 'value',
    render: (row: RequestParam, index: number) =>
      h(NInput, {
        value: row.value,
        placeholder: 'Value',
        size: 'small',
        'onUpdate:value': (value: string) => {
          row.value = value;
          debouncedEmit();
        }
      })
  },
  {
    title: 'Description',
    key: 'description',
    render: (row: RequestParam, index: number) =>
      h(NInput, {
        value: row.description,
        placeholder: 'Description',
        size: 'small',
        'onUpdate:value': (value: string) => {
          row.description = value;
          debouncedEmit();
        }
      })
  },
  {
    title: '',
    key: 'actions',
    width: 50,
    render: (_row: RequestParam, index: number) =>
      h(NButton, {
        text: true,
        type: 'error',
        size: 'small',
        onClick: () => handleRemoveParam(index)
      }, {
        icon: () => h(NIcon, null, { default: () => h(TrashIcon) })
      })
  }
];

function handleAddParam() {
  params.value.push({ key: '', value: '', enabled: true });
  params.value = [...params.value];
}

function handleRemoveParam(index: number) {
  params.value.splice(index, 1);
  if (params.value.length === 0) {
    params.value.push({ key: '', value: '', enabled: true });
  }
  params.value = [...params.value];
}
</script>

<style scoped>
.params-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 0;
}

.add-button {
  margin-top: 12px;
  flex-shrink: 0;
}
</style>
