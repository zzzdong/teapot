<template>
  <n-modal
    v-model:show="show"
    :mask-closable="false"
    preset="dialog"
    title="配置管理"
    :style="{ width: '800px', maxWidth: '90vw' }"
    @close="handleClose"
  >
    <n-tabs type="line" size="large">
      <n-tab-pane name="httpClient" tab="HTTP客户端">
        <HttpClientSettingsTab />
      </n-tab-pane>
      <n-tab-pane name="general" tab="通用" disabled>
        <p>通用设置（待实现）</p>
      </n-tab-pane>
      <n-tab-pane name="network" tab="网络" disabled>
        <p>网络设置（待实现）</p>
      </n-tab-pane>
      <n-tab-pane name="editor" tab="编辑器" disabled>
        <p>编辑器设置（待实现）</p>
      </n-tab-pane>
    </n-tabs>

    <template #action>
      <n-space justify="end" style="width: 100%;">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSave" :loading="saving">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NTabs, NTabPane, NButton, NSpace, useMessage } from 'naive-ui';
import HttpClientSettingsTab from './HttpClientSettingsTab.vue';
import { useSettingsStore } from '@/stores/settings';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const show = defineModel<boolean>('show', { default: false });

const message = useMessage();
const settingsStore = useSettingsStore();
const saving = ref(false);

watch(show, (newVal) => {
  if (newVal) {
    // 当对话框打开时，重新加载设置以确保数据最新
    settingsStore.load();
  }
});

function handleClose() {
  show.value = false;
  emit('close');
  // 重置为存储中的值，丢弃未保存的更改
  settingsStore.load();
}

async function handleSave() {
  saving.value = true;
  try {
    await settingsStore.save();
    message.success('配置已保存');
    handleClose();
  } catch (error) {
    message.error('保存失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
}
</script>