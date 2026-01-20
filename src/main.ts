import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import App from './App.vue';
import './styles/main.css';
import * as tauriApi from './api/tauri-api';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(naive);

app.mount('#app');

// 初始化 cookie 存储
tauriApi.httpClient.initCookieStorage().catch(err => {
  console.error('Failed to initialize cookie storage:', err);
});
