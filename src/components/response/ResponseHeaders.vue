<template>
  <div class="response-headers">
    <div class="search-bar">
      <n-input
        v-model:value="searchText"
        placeholder="Search headers..."
        clearable
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
    </div>

    <div class="table-container">
      <SimpleTable
        :columns="columns"
        :data="filteredHeaders"
        :bordered="false"
        :single-line="true"
        no-data-text="No headers found"
        @sort="handleSort"
      >
        <template #sort-icon-key>
          <n-icon v-if="sortKey === 'key'" :size="14" :color="'#2080f0'">
            <ArrowUpOutline v-if="sortOrder === 'asc'" />
            <ArrowDownOutline v-else />
          </n-icon>
        </template>
        <template #sort-icon-value>
          <n-icon v-if="sortKey === 'value'" :size="14" :color="'#2080f0'">
            <ArrowUpOutline v-if="sortOrder === 'asc'" />
            <ArrowDownOutline v-else />
          </n-icon>
        </template>
      </SimpleTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NInput, NIcon, NButton } from 'naive-ui';
import { SearchOutline, CopyOutline, ArrowUpOutline, ArrowDownOutline } from '@vicons/ionicons5';
import { useResponseStore } from '@/stores/response';
import SimpleTable from '@/components/common/SimpleTable.vue';

const responseStore = useResponseStore();
const searchText = ref('');
const sortKey = ref<'key' | 'value'>('key');
const sortOrder = ref<'asc' | 'desc'>('asc');

interface Column {
  key: string;
  title: string;
  width?: number;
  ellipsis?: boolean;
  sortable?: boolean;
  render?: (row: any, index: number) => any;
}

const columns: Column[] = [
  {
    title: 'Header',
    key: 'key',
    width: 200,
    sortable: true,
    render: (row: any) => h('span', {
      style: 'font-weight: 500; color: #2080f0;'
    }, row.key)
  },
  {
    title: 'Value',
    key: 'value',
    sortable: true,
    ellipsis: true
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    render: (row: any) => h(NButton, {
      text: true,
      size: 'small',
      onClick: () => handleCopyValue(row.key, row.value)
    }, {
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
    })
  }
];

const headersArray = computed(() => {
  const headers = responseStore.headers;
  return Object.entries(headers).map(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(v => ({ key, value: v }));
    }
    return { key, value: String(value) };
  }).flat();
});

const sortedHeaders = computed(() => {
  const headers = [...headersArray.value];
  return headers.sort((a, b) => {
    const aValue = a[sortKey.value].toLowerCase();
    const bValue = b[sortKey.value].toLowerCase();
    
    if (sortOrder.value === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });
});

const filteredHeaders = computed(() => {
  let headers = sortedHeaders.value;
  
  if (!searchText.value) {
    return headers;
  }

  const search = searchText.value.toLowerCase();
  return headers.filter(header =>
    header.key.toLowerCase().includes(search) ||
    header.value.toLowerCase().includes(search)
  );
});

function handleSort(key: 'key' | 'value') {
  if (sortKey.value === key) {
    // 切换排序顺序
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    // 切换到新的排序列，默认升序
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

function handleCopyValue(key: string, value: string) {
  try {
    navigator.clipboard.writeText(value);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}
</script>

<style scoped>
.response-headers {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 0;
}

.search-bar {
  padding: 12px 16px;
  flex-shrink: 0;
}

.table-container {
  flex: 1;
  min-height: 0;
  flex-shrink: 0;
}
</style>
