import { describe, it, expect, beforeEach, vi } from 'vitest'
import { request, store, mergeRequestConfig } from '@/api/tauri-api'

describe('Tauri API', () => {
  beforeEach(() => {
    // 模拟window对象
    globalThis.window = {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      __TAURI_INTERNALS__: {}
    } as any
    
    // 模拟atob函数
    globalThis.atob = vi.fn((str: string) => Buffer.from(str, 'base64').toString('binary'))
    
    // 模拟TextEncoder和TextDecoder
    globalThis.TextEncoder = class MockTextEncoder {
      encode(str: string): Uint8Array {
        return new Uint8Array(Buffer.from(str))
      }
    }
    
    globalThis.TextDecoder = class MockTextDecoder {
      constructor(public encoding: string = 'utf-8') {}
      
      decode(bytes: Uint8Array): string {
        return Buffer.from(bytes).toString(this.encoding)
      }
    }
    
    // 模拟Tauri API
    vi.mock('@tauri-apps/api/core', () => ({
      invoke: vi.fn(async (cmd: string, args: any) => {
        if (cmd === 'send_request') {
          // 返回模拟响应
          return {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' },
            body: Array.from(Buffer.from('{"message":"success"}')),
            size: 18,
            duration: 123
          }
        }
        return { success: true }
      })
    }))
    
    // 模拟console
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Store Operations', () => {
    it('should handle store operations gracefully', async () => {
      // 移除__TAURI_INTERNALS__，这样代码会直接使用localStorage
      delete window.__TAURI_INTERNALS__
      
      // 测试set操作
      await store.set('test-key', { test: 'value' })
      
      // 测试get操作
      const value = await store.get('test-key')
      expect(value).toEqual({ test: 'value' })
    })
  })

  describe('Request Operations', () => {
    it('should throw error when not in Tauri context', async () => {
      // 删除TAURI_INTERNALS
      delete window.__TAURI_INTERNALS__
      
      await expect(request.send({})).rejects.toThrow('Tauri HTTP plugin not available. Use browser fetch for development.')
    })

    it('should send GET request with headers', async () => {
      const mockInvoke = vi.fn(async () => ({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: Array.from(Buffer.from('{"message":"success"}')),
        size: 18,
        duration: 123
      }))
      
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke
      }))
      
      const response = await request.send({
        method: 'GET',
        url: 'https://example.com/api',
        headers: [{ key: 'Authorization', value: 'Bearer token123', enabled: true }],
        params: [{ key: 'page', value: '1', enabled: true }]
      })
      
      expect(mockInvoke).toHaveBeenCalled()
      const callArgs = mockInvoke.mock.calls[0][1].config
      
      expect(callArgs.url).toBe('https://example.com/api?page=1')
      expect(callArgs.method).toBe('GET')
      expect(callArgs.headers).toEqual({
        'Authorization': 'Bearer token123'
      })
      expect(callArgs.body).toBeUndefined()
      
      expect(response.status).toBe(200)
      expect(response.statusText).toBe('OK')
      expect(response.body).toBe('{"message":"success"}')
      expect(response.size).toBe(18)
      expect(response.duration).toBe(123)
    })

    it('should send POST request with JSON body', async () => {
      const mockInvoke = vi.fn(async () => ({
        status: 201,
        statusText: 'Created',
        headers: { 'Content-Type': 'application/json' },
        body: Array.from(Buffer.from('{"id":123}')),
        size: 10,
        duration: 250
      }))
      
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke
      }))
      
      const response = await request.send({
        method: 'POST',
        url: 'https://example.com/api/users',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: {
          type: 'raw',
          rawType: 'json',
          raw: '{"name":"John","email":"john@example.com"}',
          formData: [],
          urlencoded: [],
          graphql: { query: '', variables: '{}' },
          binary: null
        }
      })
      
      expect(mockInvoke).toHaveBeenCalled()
      const callArgs = mockInvoke.mock.calls[0][1].config
      
      expect(callArgs.url).toBe('https://example.com/api/users')
      expect(callArgs.method).toBe('POST')
      expect(callArgs.headers).toEqual({
        'Content-Type': 'application/json'
      })
      expect(Buffer.from(callArgs.body || [])).toEqual(Buffer.from('{"name":"John","email":"john@example.com"}'))
      
      expect(response.status).toBe(201)
      expect(response.statusText).toBe('Created')
      expect(response.body).toBe('{"id":123}')
    })

    it('should handle authentication headers', async () => {
      const mockInvoke = vi.fn(async () => ({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: Array.from(Buffer.from('{"message":"success"}')),
        size: 18,
        duration: 123
      }))
      
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke
      }))
      
      // 测试Bearer认证
      await request.send({
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'bearer',
          bearer: { token: 'bearer-token-123' }
        }
      })
      
      let callArgs = mockInvoke.mock.calls[0][1].config
      expect(callArgs.headers).toEqual({
        'Authorization': 'Bearer bearer-token-123'
      })
      
      // 测试Basic认证
      mockInvoke.mockClear()
      await request.send({
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'basic',
          basic: { username: 'user', password: 'pass' }
        }
      })
      
      callArgs = mockInvoke.mock.calls[0][1].config
      expect(callArgs.headers).toEqual({
        'Authorization': 'Basic dXNlcjpwYXNz'
      })
      
      // 测试API Key认证
      mockInvoke.mockClear()
      await request.send({
        method: 'GET',
        url: 'https://example.com/api',
        auth: {
          type: 'apikey',
          apiKey: {
            key: 'X-API-Key',
            value: 'api-key-123',
            addTo: 'header'
          }
        }
      })
      
      callArgs = mockInvoke.mock.calls[0][1].config
      expect(callArgs.headers).toEqual({
        'X-API-Key': 'api-key-123'
      })
    })

    it('should handle query parameters', async () => {
      const mockInvoke = vi.fn(async () => ({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: Array.from(Buffer.from('[]')),
        size: 2,
        duration: 100
      }))
      
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke
      }))
      
      await request.send({
        method: 'GET',
        url: 'https://example.com/api/users',
        params: [
          { key: 'page', value: '2', enabled: true },
          { key: 'limit', value: '10', enabled: true },
          { key: 'sort', value: 'asc', enabled: false } // 这个应该被忽略
        ]
      })
      
      const callArgs = mockInvoke.mock.calls[0][1].config
      expect(callArgs.url).toBe('https://example.com/api/users?page=2&limit=10')
    })

    it('should handle URL without protocol', async () => {
      const mockInvoke = vi.fn(async () => ({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: Array.from(Buffer.from('{}')),
        size: 2,
        duration: 50
      }))
      
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke
      }))
      
      await request.send({
        method: 'GET',
        url: 'example.com'
      })
      
      const callArgs = mockInvoke.mock.calls[0][1].config
      expect(callArgs.url).toBe('http://example.com')
    })

    it('should handle binary data', async () => {
      const mockInvoke = vi.fn(async () => ({
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Array.from(Buffer.from([0x00, 0x01, 0x02, 0x03])),
        size: 4,
        duration: 150
      }))
      
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke
      }))
      
      const binaryData = [0x00, 0x01, 0x02, 0x03]
      
      const response = await request.send({
        method: 'POST',
        url: 'https://example.com/api/upload',
        body: {
          type: 'binary',
          rawType: 'json',
          raw: '',
          formData: [],
          urlencoded: [],
          graphql: { query: '', variables: '{}' },
          binary: binaryData
        }
      })
      
      const callArgs = mockInvoke.mock.calls[0][1].config
      expect(callArgs.body).toEqual(binaryData)
      
      // 二进制响应应该保持为字符串
      expect(typeof response.body).toBe('string')
      expect(response.body).toBe(String.fromCharCode(0x00, 0x01, 0x02, 0x03))
    })
  })

  describe('Config Merge', () => {
    it('should merge request config with global settings', () => {
      const requestConfig = {
        url: 'https://example.com',
        method: 'GET',
        timeout: 10000,
        sslVerification: false
      }
      
      const globalSettings = {
        defaultTimeout: 30000,
        verifySsl: true,
        defaultUserAgent: 'MyApp/1.0'
      }
      
      const merged = mergeRequestConfig(requestConfig, globalSettings)
      
      expect(merged).toEqual({
        ...requestConfig,
        sslVerification: false, // request config优先
        timeout: 10000, // request config优先
        userAgent: 'MyApp/1.0', // 使用全局设置
        followRedirects: true, // 使用默认值
        caCertPaths: undefined // 未设置
      })
    })

    it('should use defaults when no config provided', () => {
      const requestConfig = {
        url: 'https://example.com',
        method: 'GET'
      }
      
      const merged = mergeRequestConfig(requestConfig)
      
      expect(merged).toEqual({
        ...requestConfig,
        sslVerification: true, // 默认值
        timeout: 30000, // 默认值
        userAgent: 'Teapot/1.0', // 默认值
        followRedirects: true, // 默认值
        caCertPath: undefined // 未设置
      })
    })
  })
})
