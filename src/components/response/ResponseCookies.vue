<template>
  <div class="response-cookies">
    <div
      v-if="cookies.length === 0"
      class="no-cookies"
    >
      <n-icon
        size="48"
        :color="'#ccc'"
      >
        <CookieOutline />
      </n-icon>
      <p>No cookies in response</p>
    </div>

    <n-data-table
      v-else
      :columns="columns"
      :data="cookies"
      :pagination="false"
      :bordered="false"
      size="small"
    />
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue';
import { NDataTable, NIcon, NTag } from 'naive-ui';
import { FileTrayOutline as CookieOutline } from '@vicons/ionicons5';
import type { RequestContext } from '@/types';
import type { Cookie } from '@/types/response';

interface Props {
  context: RequestContext;
}

const props = defineProps<Props>();

// Extract cookies from context response
const cookies = computed(() => {
  const response = props.context?.response;
  if (!response) return [];

  const extractedCookies: Cookie[] = [];
  const setCookieHeader = response.headers['set-cookie'];

  if (setCookieHeader) {
    const cookiesArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookiesArray.forEach((cookieString) => {
      const parts = cookieString.split(';');
      const [name, value] = parts[0].split('=');
      const cookie: Cookie = {
        name: name.trim(),
        value: value || '',
        domain: '',
        path: '/',
        httpOnly: false,
        secure: false,
      };

      parts.slice(1).forEach((part: string) => {
        const [key, val] = part.trim().split('=');
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'domain') cookie.domain = val || '';
        else if (lowerKey === 'path') cookie.path = val || '/';
        else if (lowerKey === 'expires') cookie.expires = val || '';
        else if (lowerKey === 'httponly') cookie.httpOnly = true;
        else if (lowerKey === 'secure') cookie.secure = true;
        else if (lowerKey === 'samesite') cookie.sameSite = val as any;
      });

      extractedCookies.push(cookie);
    });
  }

  return extractedCookies;
});

const columns = [
  {
    title: 'Name',
    key: 'name',
    width: 150,
    render: (row: any) =>
      h(
        'span',
        {
          style: 'font-weight: 500;',
        },
        row.name
      ),
  },
  {
    title: 'Value',
    key: 'value',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: 'Domain',
    key: 'domain',
    width: 120,
  },
  {
    title: 'Path',
    key: 'path',
    width: 80,
  },
  {
    title: 'Flags',
    key: 'flags',
    width: 150,
    render: (row: any) =>
      h(
        'div',
        { style: 'display: flex; gap: 4px; flex-wrap: wrap;' },
        [
          row.httpOnly && h(NTag, { size: 'small', type: 'info' }, { default: () => 'HttpOnly' }),
          row.secure && h(NTag, { size: 'small', type: 'success' }, { default: () => 'Secure' }),
          row.sameSite && h(NTag, { size: 'small', type: 'warning' }, { default: () => row.sameSite }),
        ].filter(Boolean)
      ),
  },
  {
    title: 'Expires',
    key: 'expires',
    width: 150,
  },
];
</script>

<style scoped>
.response-cookies {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 0;
}

.no-cookies {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #999;
}

.no-cookies p {
  margin-top: 12px;
  font-size: 14px;
}
</style>
