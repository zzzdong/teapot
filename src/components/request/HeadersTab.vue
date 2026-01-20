<template>
  <div class="headers-tab">
    <div class="table-wrapper">
      <n-data-table
        :row-key="getRowKey"
        :columns="columns"
        :data="headers"
        :pagination="false"
        :bordered="false"
        size="small"
        :max-height="tableHeight"
      />
    </div>
    <n-button
      text
      type="primary"
      class="add-button"
      @click="handleAddHeader"
    >
      + Add Header
    </n-button>

    <div v-if="commonHeaders.length > 0" class="common-headers">
      <div class="section-title">Common Headers</div>
      <n-space>
        <n-tag
          v-for="header in commonHeaders"
          :key="header.key"
          size="small"
          checkable
          :checked="hasHeader(header.key)"
          @update:checked="checked => handleToggleCommonHeader(header.key, checked)"
        >
          {{ header.key }}
        </n-tag>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { NButton, NCheckbox, NInput, NDataTable, NIcon, NSpace, NTag } from 'naive-ui';
import { AddOutline as AddIcon, TrashOutline as TrashIcon } from '@vicons/ionicons5';
import type { RequestHeader } from '@/types/request';

const headers = defineModel<RequestHeader[]>('headers', {
  default: () => [
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Accept', value: 'application/json', enabled: true }
  ]
});

const tableHeight = ref(300);

// Use key + value + enabled as a unique identifier for each row
// This avoids re-rendering the entire row when content changes
const rowKeySet = new WeakMap<RequestHeader, number>();
let keyCounter = 0;

const getRowKey = (row: RequestHeader): string => {
  if (!rowKeySet.has(row)) {
    rowKeySet.set(row, ++keyCounter);
  }
  return `header-${rowKeySet.get(row)}`;
};

// Debounce emit to avoid excessive re-renders
let emitTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedEmit() {
  if (emitTimer) clearTimeout(emitTimer);
  emitTimer = setTimeout(() => {
    headers.value = [...headers.value];
  }, 300);
}

const commonHeaders = [
  { key: 'Accept-Encoding', value: 'gzip, deflate, br' },
  { key: 'Accept-Language', value: 'en-US,en;q=0.9' },
  { key: 'Cache-Control', value: 'no-cache' },
  { key: 'User-Agent', value: 'Teapot/1.0.0' },
  { key: 'Referer', value: '' }
];

const columns = [
  {
    title: '',
    key: 'enabled',
    width: 50,
    render: (row: RequestHeader, index: number) =>
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
    render: (row: RequestHeader, index: number) =>
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
    render: (row: RequestHeader, index: number) =>
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
    render: (row: RequestHeader, index: number) =>
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
    render: (_row: RequestHeader, index: number) =>
      h(NButton, {
        text: true,
        type: 'error',
        size: 'small',
        onClick: () => handleRemoveHeader(index)
      }, {
        icon: () => h(NIcon, null, { default: () => h(TrashIcon) })
      })
  }
];

function hasHeader(key: string): boolean {
  return headers.value.some(h => h.key === key && h.enabled);
}

function handleToggleCommonHeader(key: string, checked: boolean) {
  const index = headers.value.findIndex(h => h.key === key);
  const commonHeader = commonHeaders.find(h => h.key === key);

  if (checked) {
    if (index === -1) {
      headers.value.push({
        key,
        value: commonHeader?.value || '',
        enabled: true
      });
    } else {
      headers.value[index].enabled = true;
    }
  } else {
    if (index !== -1) {
      headers.value[index].enabled = false;
    }
  }

  debouncedEmit();
}

function handleAddHeader() {
  headers.value.push({ key: '', value: '', enabled: true });
  debouncedEmit();
}

function handleRemoveHeader(index: number) {
  headers.value.splice(index, 1);
  if (headers.value.length === 0) {
    headers.value.push({ key: '', value: '', enabled: true });
  }
  debouncedEmit();
}

// Calculate table height dynamically
function updateTableHeight() {
  const element = document.querySelector('.headers-tab');
  if (element) {
    const height = element.clientHeight;
    const buttonHeight = 40;
    const commonHeadersHeight = document.querySelector('.common-headers')?.clientHeight || 0;
    const padding = 24;
    tableHeight.value = height - buttonHeight - commonHeadersHeight - padding;
  }
}

onMounted(() => {
  updateTableHeight();
  window.addEventListener('resize', updateTableHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight);
});
</script>

<style scoped>
.headers-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 12px 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.add-button {
  margin-top: 12px;
  flex-shrink: 0;
}

.common-headers {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #666;
}
</style>
