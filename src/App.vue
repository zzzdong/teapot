<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="app-container">
            <AppHeader />
            <div class="app-content">
              <div class="resizer-left-wrapper">
                <LeftSidebar :style="{ width: leftSidebarWidth + 'px' }" />
                <div class="resizer" @mousedown="startLeftResize"></div>
              </div>
              <MainWorkspace :style="{ flex: '1' }" />
              <div class="resizer-right-wrapper">
                <div class="resizer" @mousedown="startRightResize"></div>
                <RightSidebar :style="{ width: rightSidebarWidth + 'px' }" />
              </div>
            </div>
            <StatusBar />
          </div>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { NConfigProvider, darkTheme, type GlobalTheme } from 'naive-ui';
import AppHeader from './components/layout/AppHeader.vue';
import LeftSidebar from './components/layout/LeftSidebar.vue';
import MainWorkspace from './components/layout/MainWorkspace.vue';
import RightSidebar from './components/layout/RightSidebar.vue';
import StatusBar from './components/layout/StatusBar.vue';
import { useHistoryStore } from './stores/history';
import { useCollectionsStore } from './stores/collections';
import { useEnvironmentStore } from './stores/environment';
import { useWorkspaceStore } from './stores/workspace';

// Theme
const isDark = ref(false);
const theme = computed<GlobalTheme | null>(() => (isDark.value ? darkTheme : null));

// Theme overrides for rounded corners (4px)
const themeOverrides = {
  common: {
    borderRadius: '4px',
    borderRadiusSmall: '2px',
    borderRadiusMedium: '4px',
    borderRadiusLarge: '6px'
  }
};

// Resizer state
const leftSidebarWidth = ref(280);
const rightSidebarWidth = ref(300);

const isResizingLeft = ref(false);
const isResizingRight = ref(false);
const startX = ref(0);
const startLeftWidth = ref(0);
const startRightWidth = ref(0);

function startLeftResize(e: MouseEvent) {
  isResizingLeft.value = true;
  startX.value = e.clientX;
  startLeftWidth.value = leftSidebarWidth.value;

  document.addEventListener('mousemove', handleLeftMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function startRightResize(e: MouseEvent) {
  isResizingRight.value = true;
  startX.value = e.clientX;
  startRightWidth.value = rightSidebarWidth.value;

  document.addEventListener('mousemove', handleRightMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleLeftMouseMove(e: MouseEvent) {
  if (!isResizingLeft.value) return;

  const diff = e.clientX - startX.value;
  const newWidth = Math.max(200, Math.min(500, startLeftWidth.value + diff));
  leftSidebarWidth.value = newWidth;
}

function handleRightMouseMove(e: MouseEvent) {
  if (!isResizingRight.value) return;

  const diff = e.clientX - startX.value;
  const newWidth = Math.max(200, Math.min(500, startRightWidth.value - diff));
  rightSidebarWidth.value = newWidth;
}

function stopResize() {
  isResizingLeft.value = false;
  isResizingRight.value = false;

  document.removeEventListener('mousemove', handleLeftMouseMove);
  document.removeEventListener('mousemove', handleRightMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleLeftMouseMove);
  document.removeEventListener('mousemove', handleRightMouseMove);
  document.removeEventListener('mouseup', stopResize);
});

onMounted(() => {
  // Load stores
  const { loadFromStore: loadHistory } = useHistoryStore();
  const { loadFromStore: loadCollections } = useCollectionsStore();
  const { loadFromStore: loadEnvironments } = useEnvironmentStore();
  const { loadFromStore: loadWorkspace } = useWorkspaceStore();

  Promise.all([
    loadHistory(),
    loadCollections(),
    loadEnvironments(),
    loadWorkspace()
  ]);
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.resizer-left-wrapper {
  display: flex;
  min-width: 200px;
  max-width: 500px;
}

.resizer-right-wrapper {
  display: flex;
  min-width: 200px;
  max-width: 500px;
}

.resizer {
  width: 4px;
  background-color: #e0e0e0;
  cursor: col-resize;
  transition: background-color 0.2s;
  flex-shrink: 0;
  z-index: 100;
}

.resizer:hover {
  background-color: #1890ff;
}

.resizer:active {
  background-color: #1890ff;
}

.resizer-left-wrapper .resizer {
  border-right: 1px solid var(--border-color);
}

.resizer-right-wrapper .resizer {
  border-left: 1px solid var(--border-color);
}
</style>
