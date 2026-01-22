<template>
  <div class="form-data-editor">
    <n-data-table
      :columns="columns"
      :data="formData"
      :pagination="false"
      :bordered="false"
      size="small"
    />
    <n-button
      text
      type="primary"
      class="add-button"
      @click="handleAddItem"
    >
      + Add Item
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch } from 'vue';
import { NButton, NCheckbox, NInput, NDataTable, NIcon, NRadio, NRadioGroup, NSpace } from 'naive-ui';
import { AddOutline as AddIcon, TrashOutline as TrashIcon, DocumentOutline as FileIcon } from '@vicons/ionicons5';
import type { FormDataItem } from '@/types/request';

interface Props {
  formData?: FormDataItem[];
}

interface Emits {
  (e: 'update', formData: FormDataItem[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local copy for editing
const localFormData = ref<FormDataItem[]>([]);

// Initialize local formData from props
function initLocalFormData() {
  if (props.formData && props.formData.length > 0) {
    localFormData.value = [...props.formData];
  } else {
    localFormData.value = [{ key: '', value: '', type: 'text', enabled: true }];
  }
}

initLocalFormData();

// Watch for prop changes
watch(
  () => props.formData,
  (newFormData) => {
    localFormData.value =
      newFormData && newFormData.length > 0 ? [...newFormData] : [{ key: '', value: '', type: 'text', enabled: true }];
  },
  { deep: true }
);

const columns = [
  {
    title: '',
    key: 'enabled',
    width: 50,
    render: (row: FormDataItem, index: number) =>
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
    render: (row: FormDataItem, index: number) =>
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
    title: 'Type',
    key: 'type',
    width: 100,
    render: (row: FormDataItem, index: number) =>
      h(
        NRadioGroup,
        {
          value: row.type,
          size: 'small',
          'onUpdate:value': (value: 'text' | 'file') => {
            row.type = value;
            emitUpdate();
          },
        },
        {
          default: () =>
            h(
              NSpace,
              { size: 'small' },
              {
                default: () => [
                  h(NRadio, { value: 'text' }, { default: () => 'Text' }),
                  h(NRadio, { value: 'file' }, { default: () => 'File' }),
                ],
              }
            ),
        }
      ),
  },
  {
    title: 'Value / File',
    key: 'value',
    render: (row: FormDataItem, index: number) => {
      if (row.type === 'file') {
        return h('input', {
          type: 'file',
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
              row.file = target.files[0];
              row.value = target.files[0].name;
              emitUpdate();
            }
          },
        });
      }
      return h(NInput, {
        value: row.value,
        placeholder: 'Value',
        size: 'small',
        'onUpdate:value': (value: string) => {
          row.value = value;
          emitUpdate();
        },
      });
    },
  },
  {
    title: 'Description',
    key: 'description',
    render: (row: FormDataItem, index: number) =>
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
    render: (_row: FormDataItem, index: number) =>
      h(
        NButton,
        {
          text: true,
          type: 'error',
          size: 'small',
          onClick: () => handleRemoveItem(index),
        },
        {
          icon: () => h(NIcon, null, { default: () => h(TrashIcon) }),
        }
      ),
  },
];

function emitUpdate() {
  emit('update', localFormData.value);
}

function handleAddItem() {
  localFormData.value.push({ key: '', value: '', type: 'text', enabled: true });
  emit('update', localFormData.value);
}

function handleRemoveItem(index: number) {
  localFormData.value.splice(index, 1);
  if (localFormData.value.length === 0) {
    localFormData.value.push({ key: '', value: '', type: 'text', enabled: true });
  }
  emit('update', localFormData.value);
}
</script>

<style scoped>
.form-data-editor {
  padding: 8px 0;
}

.add-button {
  margin-top: 12px;
}
</style>
