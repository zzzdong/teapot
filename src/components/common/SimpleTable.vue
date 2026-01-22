<template>
  <div class="simple-table">
    <div
      v-if="data.length === 0"
      class="no-data"
    >
      {{ noDataText || 'No data' }}
    </div>
    <div
      v-else
      class="table-wrapper"
    >
      <n-table
        :bordered="bordered"
        :single-line="singleLine"
      >
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ sortable: column.sortable, 'actions-column': !column.title }"
              :style="{ width: column.width ? column.width + 'px' : '' }"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <template v-if="column.title">
                <div class="th-content">
                  <span>{{ column.title }}</span>
                  <slot
                    v-if="column.sortable"
                    :name="`sort-icon-${column.key}`"
                  >
                  </slot>
                </div>
              </template>
            </th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr
            v-for="row in data"
            :key="rowKey ? row[rowKey] : JSON.stringify(row)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="{ 'ellipsis-column': column.ellipsis }"
            >
              <template v-if="column.render">
                <component :is="column.render(row, rowIndex(row))" />
              </template>
              <template v-else-if="column.ellipsis">
                <n-ellipsis :tooltip="getCellContent(row, column)">
                  {{ getCellContent(row, column) }}
                </n-ellipsis>
              </template>
              <template v-else>
                {{ getCellContent(row, column) }}
              </template>
            </td>
          </tr>
        </tbody>
      </n-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NTable, NEllipsis } from 'naive-ui';

interface Column {
  key: string;
  title: string;
  width?: number;
  ellipsis?: boolean;
  sortable?: boolean;
  render?: (row: any, index: number) => any;
}

interface Props {
  columns: Column[];
  data: any[];
  rowKey?: string;
  bordered?: boolean;
  singleLine?: boolean;
  noDataText?: string;
}

interface Emits {
  (e: 'sort', key: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  bordered: false,
  singleLine: false,
  noDataText: 'No data',
});

const emit = defineEmits<Emits>();

function getCellContent(row: any, column: Column) {
  return row[column.key];
}

function rowIndex(row: any) {
  if (props.rowKey) {
    return props.data.findIndex((item) => item[props.rowKey!] === row[props.rowKey!]);
  }
  return props.data.indexOf(row);
}

function handleSort(key: string) {
  emit('sort', key);
}
</script>

<style scoped>
.simple-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

:deep(.n-table) {
  width: 100%;
  display: table;
}

:deep(.n-table tbody) {
  display: table-row-group;
}

:deep(.n-table tr) {
  display: table-row;
}

:deep(.n-table td),
:deep(.n-table th) {
  display: table-cell;
}

:deep(.n-table th),
:deep(.n-table td) {
  padding: 8px 12px;
  text-align: left;
}

:deep(.n-table th) {
  font-weight: 600;
  color: #333;
  background-color: #fafafa;
  user-select: none;
}

:deep(.n-table th.sortable) {
  cursor: pointer;
}

:deep(.n-table th.sortable:hover) {
  background-color: #f0f0f0;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.n-table th.actions-column) {
  cursor: default;
}

:deep(.n-table tbody tr:hover) {
  background-color: #f5f5f5;
}

:deep(.n-table tbody tr:nth-child(even)) {
  background-color: #fafafa;
}

:deep(.n-table tbody tr:nth-child(even):hover) {
  background-color: #f5f5f5;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.ellipsis-column {
  max-width: 0;
}

.table-body {
  overflow: visible;
}
</style>
