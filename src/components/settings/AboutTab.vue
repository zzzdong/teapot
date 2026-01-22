<template>
  <div class="about-tab">
    <div class="about-header">
      <img
        src="/teapot-icon.svg"
        alt="Teapot Logo"
        class="logo"
      />
      <h1 class="app-name">Teapot</h1>
      <p class="app-description">Teapot, an API buddy</p>
      <n-tag
        type="primary"
        size="large"
        >v{{ version }}</n-tag
      >
    </div>

    <n-divider />

    <div class="about-info">
      <n-descriptions
        :column="1"
        bordered
        label-placement="left"
      >
        <n-descriptions-item label="版本"> v{{ version }} </n-descriptions-item>
        <n-descriptions-item label="许可证">
          <n-button
            text
            tag="a"
            href="LICENSE"
            target="_blank"
          >
            MIT License
          </n-button>
        </n-descriptions-item>
        <n-descriptions-item label="作者">
          <n-button
            text
            tag="a"
            href="mailto:kuwater@163.com"
          >
            zzzdong &lt;kuwater@163.com&gt;
          </n-button>
        </n-descriptions-item>
      </n-descriptions>
    </div>

    <n-divider />

    <div class="about-links">
      <n-space
        vertical
        :size="12"
      >
        <n-button
          type="primary"
          block
          @click="handleOpenRepo"
        >
          <template #icon>
            <n-icon><LogoGithubIcon /></n-icon>
          </template>
          GitHub 仓库
        </n-button>
        <n-button
          type="default"
          block
          @click="handleOpenDocs"
        >
          <template #icon>
            <n-icon><BookIcon /></n-icon>
          </template>
          文档
        </n-button>
        <n-button
          type="default"
          block
          @click="handleOpenIssues"
        >
          <template #icon>
            <n-icon><BugIcon /></n-icon>
          </template>
          问题反馈
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NTag, NDivider, NDescriptions, NDescriptionsItem, NButton, NIcon, NSpace } from 'naive-ui';
import { LogoGithub as LogoGithubIcon, BookOutline as BookIcon, BugOutline as BugIcon } from '@vicons/ionicons5';
import { getVersion } from '@tauri-apps/api/app';

const version = ref('1.0.0');

// Load version from Tauri
onMounted(async () => {
  try {
    version.value = await getVersion();
  } catch (error) {
    console.error('Failed to get version:', error);
  }
});

function handleOpenRepo() {
  window.open('https://github.com/zzzdong/teapot', '_blank');
}

function handleOpenDocs() {
  window.open('README.md', '_blank');
}

function handleOpenIssues() {
  window.open('https://github.com/zzzdong/teapot/issues', '_blank');
}
</script>

<style scoped>
.about-tab {
  padding: 24px;
  max-height: 500px;
  overflow-y: auto;
}

.about-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
}

.logo {
  width: 80px;
  height: 80px;
}

.app-name {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--n-text-color);
}

.app-description {
  margin: 0;
  font-size: 14px;
  color: var(--n-text-color-3);
}

.about-info {
  max-width: 500px;
  margin: 0 auto;
}

.about-links {
  max-width: 400px;
  margin: 0 auto;
}

:deep(.n-descriptions) {
  --n-label-color: var(--n-text-color-2);
}
</style>
