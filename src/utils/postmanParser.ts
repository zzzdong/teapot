import type { HttpMethod } from '@/types';

/**
 * Postman Collection v2.1 格式导入解析器
 */

export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

export interface PostmanRequest {
  url?:
    | {
        raw?: string;
        protocol?: string;
        host?: string[];
        port?: string;
        path?: string[];
        query?: { key: string; value: string }[];
      }
    | string;
  method?: string;
  header?: { key: string; value: string; disabled?: boolean }[];
  body?: {
    mode?: 'raw' | 'urlencoded' | 'formdata' | 'file';
    raw?: string;
    urlencoded?: { key: string; value: string }[];
    formdata?: { key: string; value?: string; src?: string; type?: 'file' | 'text' }[];
    file?: { src?: string };
  };
  auth?: any;
}

export interface PostmanItem {
  name: string;
  description?: string;
  request?: PostmanRequest;
  response?: any[];
  item?: PostmanItem[];
}

export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    _postman_id?: string;
    description?: string;
  };
  item: PostmanItem[];
  variable?: PostmanVariable[];
  auth?: any;
}

/**
 * 将 Postman Collection 转换为 Teapot Collection
 */
export function convertPostmanToTeapot(postmanCollection: PostmanCollection) {
  const result = {
    collections: [] as any[],
    environments: [] as any[],
  };

  // 创建集合
  const collection = {
    id: postmanCollection.info._postman_id || Date.now().toString(),
    name: postmanCollection.info.name,
    description: postmanCollection.info.description || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    requests: [] as any[],
    folders: [] as any[],
  };

  // 转换变量为环境（如果存在）
  if (postmanCollection.variable && postmanCollection.variable.length > 0) {
    const environment = {
      id: `env-${Date.now()}`,
      name: `${collection.name} Environment`,
      description: 'Imported from Postman Collection',
      values: postmanCollection.variable.map((v) => ({
        key: v.key,
        value: v.value,
        type: 'text',
      })),
      isActive: false,
    };
    result.environments.push(environment);
  }

  // 转换请求和文件夹
  const folderMap = new Map<string, any>();

  postmanCollection.item.forEach((item, index) => {
    if (item.request) {
      // 如果是直接请求（不在文件夹中）
      const request = convertPostmanRequest(item);
      collection.requests.push(request);
    } else if (item.item && Array.isArray(item.item)) {
      // 如果是文件夹
      const folderId = `folder-${Date.now()}-${index}`;
      const folder = {
        id: folderId,
        name: item.name,
        description: item.description || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        requests: [] as any[],
      };

      // 转换文件夹内的请求
      item.item.forEach((subItem, subIndex) => {
        if (subItem.request) {
          const request = convertPostmanRequest(subItem);
          folder.requests.push(request);
        }
      });

      collection.folders.push(folder);
    }
  });

  result.collections.push(collection);
  return result;
}

/**
 * 将 Postman Request 转换为 Teapot Request
 */
function convertPostmanRequest(item: PostmanItem) {
  const request = item.request!;
  const url = typeof request.url === 'string' ? request.url : request.url?.raw || '';
  const method = (request.method || 'GET').toUpperCase() as HttpMethod;

  // 解析 URL 和查询参数
  const urlObj = new URL(url.includes('://') ? url : `http://${url}`);
  const path = urlObj.pathname + urlObj.search;
  const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;

  // 转换请求头
  const headers = request.header
    ? request.header.filter((h) => !h.disabled).map((h) => ({ key: h.key, value: h.value }))
    : [];

  // 转换请求体
  let body: any = { mode: 'none' };

  if (request.body) {
    switch (request.body.mode) {
      case 'raw':
        body = {
          mode: 'raw',
          raw: request.body.raw || '',
        };
        break;
      case 'urlencoded':
        body = {
          mode: 'urlencoded',
          urlencoded:
            request.body.urlencoded?.map((f) => ({
              key: f.key,
              value: f.value,
              enabled: true,
            })) || [],
        };
        break;
      case 'formdata':
        body = {
          mode: 'formdata',
          formdata:
            request.body.formdata?.map((f) => ({
              key: f.key,
              value: f.value || '',
              type: f.type || 'text',
              src: f.src || '',
              enabled: true,
            })) || [],
        };
        break;
      case 'file':
        body = {
          mode: 'file',
          file: {
            src: request.body.file?.src || '',
          },
        };
        break;
    }
  }

  // 转换查询参数
  const params = urlObj.searchParams
    ? Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }))
    : [];

  return {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    description: item.description || '',
    method,
    url: cleanUrl,
    headers,
    body,
    params,
    auth: {
      type: 'noauth',
      config: {},
    },
    preRequestScript: {
      enabled: false,
      content: '',
    },
    testScript: {
      enabled: false,
      content: '',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * 检测 JSON 数据是否是 Postman Collection 格式
 */
export function isPostmanCollection(data: any): boolean {
  return (
    data &&
    data.info &&
    data.info.schema &&
    (data.info.schema.includes('postman.com') || data.info.schema.includes('getpostman.com')) &&
    Array.isArray(data.item)
  );
}

/**
 * 检测 JSON 数据是否是 Teapot 格式
 */
export function isTeapotFormat(data: any): boolean {
  return data && (Array.isArray(data.collections) || Array.isArray(data.environments));
}
