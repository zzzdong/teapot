<template>
  <div class="urlencoded-editor">
    <n-data-table
      :columns="columns"
      :data="urlencoded"
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

interface Props {
  urlencoded?: RequestParam[];
}

interface Emits {
  (e: 'update', urlencoded: RequestParam[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local copy for editing
const localUrlencoded = ref<RequestParam[]>([]);

// Initialize local urlencoded from props
function initLocalUrlencoded() {
  if (props.urlencoded && props.urlencoded.length > 0) {
    localUrlencoded.value = [...props.urlencoded];
  } else {
    localUrlencoded.value = [{ key: '', value: '', enabled: true }];
  }
}

initLocalUrlencoded();

// Watch for prop changes
watch(
  () => props.urlencoded,
  (newUrlencoded) => {
    localUrlencoded.value =
      newUrlencoded && newUrlencoded.length > 0 ? [...newUrlencoded] : [{ key: '', value: '', enabled: true }];
  },
  { deep: true }
);

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
          emitUpdate();
        },
      }),
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
          emitUpdate();
        },
      }),
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
          emitUpdate();
        },
      }),
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
          emitUpdate();
        },
      }),
  },
  {
    title: '',
    key: 'actions',
    width: 50,
    render: (_row: RequestParam, index: number) =>
      h(
        NButton,
        {
          text: true,
          type: 'error',
          size: 'small',
          onClick: () => handleRemoveParam(index),
        },
        {
          icon: () => h(NIcon, null, { default: () => h(TrashIcon) }),
        }
      ),
  },
];

function emitUpdate() {
  emit('update', localUrlencoded.value);
}

function handleAddParam() {
  localUrlencoded.value.push({ key: '', value: '', enabled: true });
  emit('update', localUrlencoded.value);
}

function handleRemoveParam(index: number) {
  localUrlencoded.value.splice(index, 1);
  if (localUrlencoded.value.length === 0) {
    localUrlencoded.value.push({ key: '', value: '', enabled: true });
  }
  emit('update', localUrlencoded.value);
}
</script>

<style scoped>
.urlencoded-editor {
  padding: 8px 0;
}

.add-button {
  margin-top: 12px;
}
</style>
