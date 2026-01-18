import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useContextStore } from '@/stores/context'
import { RequestContext } from '@/types/context'
import type { Request, Response } from '@/types'

describe('Context Store', () => {
  let contextStore: ReturnType<typeof useContextStore>

  beforeEach(() => {
    // 设置Pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
    
    // 创建store实例
    contextStore = useContextStore()
    
    // 模拟console.log
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should initialize with empty state', () => {
    expect(contextStore.contexts.size).toBe(0)
    expect(contextStore.activeContextId).toBeNull()
    expect(contextStore.activeContext).toBeNull()
    expect(contextStore.activeRequest).toBeNull()
    expect(contextStore.activeResponse).toBeNull()
  })

  it('should create a new context with default request', () => {
    const context = contextStore.createContext()
    
    expect(context).toBeDefined()
    expect(context.request).toBeDefined()
    expect(context.request.method).toBe('GET')
    expect(context.request.url).toBe('')
    expect(context.request.headers).toEqual([])
    expect(context.request.params).toEqual([])
    expect(context.request.body.type).toBe('none')
    
    // 验证context已添加到store
    expect(contextStore.contexts.size).toBeGreaterThan(0)
  })

  it('should create a context with custom request data', () => {
    const customRequest = {
      method: 'POST',
      url: 'https://example.com/api',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      body: {
        type: 'raw',
        rawType: 'json',
        raw: '{"key": "value"}',
        formData: [],
        urlencoded: [],
        graphql: { query: '', variables: '{}' },
        binary: null
      }
    }
    
    const context = contextStore.createContext(customRequest)
    
    expect(context.request.method).toBe('POST')
    expect(context.request.url).toBe('https://example.com/api')
    expect(context.request.headers).toEqual(customRequest.headers)
    expect(context.request.body).toEqual(customRequest.body)
  })

  it('should add an existing context to the store', () => {
    const customContext: RequestContext = {
      request: {
        id: 'test-123',
        name: 'Test Request',
        method: 'GET',
        url: 'https://example.com',
        params: [],
        headers: [],
        body: {
          type: 'none',
          rawType: 'json',
          raw: '',
          formData: [],
          urlencoded: [],
          graphql: { query: '', variables: '{}' },
          binary: null
        },
        auth: { type: 'noauth', config: {} },
        preRequestScript: { enabled: false, content: '' },
        testScript: { enabled: false, content: '' },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      response: {
        id: 'resp-123',
        requestId: 'test-123',
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'success' },
        size: 18,
        duration: 123,
        timestamp: Date.now()
      }
    }
    
    const contextId = contextStore.addContext(customContext)
    
    expect(contextStore.contexts.has(contextId)).toBe(true)
    const storedContext = contextStore.contexts.get(contextId)
    expect(storedContext).toEqual(customContext)
  })

  it('should update an existing context', () => {
    const context = contextStore.createContext()
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    // 更新context
    contextStore.updateContext(contextId, {
      request: {
        method: 'PUT',
        url: 'https://updated.com'
      }
    })
    
    const updatedContext = contextStore.contexts.get(contextId)
    expect(updatedContext?.request.method).toBe('PUT')
    expect(updatedContext?.request.url).toBe('https://updated.com')
  })

  it('should set and get active context', () => {
    const context1 = contextStore.createContext()
    const context2 = contextStore.createContext()
    
    // 获取contextId
    let contextId1: string | undefined
    let contextId2: string | undefined
    
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context1.request.id) {
        contextId1 = id
      }
      if (ctx.request.id === context2.request.id) {
        contextId2 = id
      }
    })
    
    if (!contextId1 || !contextId2) throw new Error('Contexts not found')
    
    // 设置active context为第一个
    contextStore.setActiveContext(contextId1)
    expect(contextStore.activeContextId).toBe(contextId1)
    expect(contextStore.activeContext?.request.id).toBe(context1.request.id)
    expect(contextStore.activeRequest?.id).toBe(context1.request.id)
    
    // 切换到第二个context
    contextStore.setActiveContext(contextId2)
    expect(contextStore.activeContextId).toBe(contextId2)
    expect(contextStore.activeContext?.request.id).toBe(context2.request.id)
    expect(contextStore.activeRequest?.id).toBe(context2.request.id)
    
    // 清除active context
    contextStore.setActiveContext(null)
    expect(contextStore.activeContextId).toBeNull()
    expect(contextStore.activeContext).toBeNull()
  })

  it('should set and get response for a context', () => {
    const context = contextStore.createContext()
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    const mockResponse: Response = {
      id: 'resp-123',
      requestId: context.request.id,
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'success' },
      size: 18,
      duration: 123,
      timestamp: Date.now()
    }
    
    contextStore.setResponse(contextId, mockResponse)
    
    const updatedContext = contextStore.contexts.get(contextId)
    expect(updatedContext?.response).toEqual(mockResponse)
    
    // 设置active context并验证计算属性
    contextStore.setActiveContext(contextId)
    expect(contextStore.activeResponse).toEqual(mockResponse)
    expect(contextStore.status).toBe(200)
    expect(contextStore.statusText).toBe('OK')
    expect(contextStore.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(contextStore.size).toBe(18)
    expect(contextStore.duration).toBe(123)
    expect(contextStore.isSuccess).toBe(true)
    expect(contextStore.isError).toBe(false)
  })

  it('should handle error response correctly', () => {
    const context = contextStore.createContext()
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    const errorResponse: Response = {
      id: 'resp-error',
      requestId: context.request.id,
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Not found' },
      size: 24,
      duration: 456,
      timestamp: Date.now()
    }
    
    contextStore.setResponse(contextId, errorResponse)
    contextStore.setActiveContext(contextId)
    
    expect(contextStore.isSuccess).toBe(false)
    expect(contextStore.isError).toBe(true)
  })

  it('should extract cookies from response headers', () => {
    const mockResponse: Response = {
      id: 'resp-cookies',
      requestId: 'req-123',
      status: 200,
      statusText: 'OK',
      headers: {
        'Set-Cookie': 'sessionId=abc123; Path=/; HttpOnly; Secure',
        'Content-Type': 'application/json'
      },
      body: {},
      size: 2,
      duration: 100,
      timestamp: Date.now()
    }
    
    const cookies = contextStore.extractCookies(mockResponse)
    
    expect(cookies).toHaveLength(1)
    expect(cookies[0].name).toBe('sessionId')
    expect(cookies[0].value).toBe('abc123')
    expect(cookies[0].path).toBe('/')
    expect(cookies[0].httpOnly).toBe(true)
    expect(cookies[0].secure).toBe(true)
  })

  it('should extract multiple cookies from response headers', () => {
    const mockResponse: Response = {
      id: 'resp-multi-cookies',
      requestId: 'req-123',
      status: 200,
      statusText: 'OK',
      headers: {
        'Set-Cookie': ['sessionId=abc123; Path=/', 'token=def456; Path=/; HttpOnly'],
        'Content-Type': 'application/json'
      },
      body: {},
      size: 2,
      duration: 100,
      timestamp: Date.now()
    } as any
    
    const cookies = contextStore.extractCookies(mockResponse)
    
    expect(cookies).toHaveLength(2)
    expect(cookies[0].name).toBe('sessionId')
    expect(cookies[1].name).toBe('token')
  })

  it('should set and get response for a context', () => {
    const context = contextStore.createContext()
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    const mockResponse: Response = {
      id: 'resp-123',
      requestId: context.request.id,
      status: 200,
      statusText: 'OK',
      headers: {},
      body: {},
      size: 2,
      duration: 100,
      timestamp: Date.now()
    }
    
    const mockTestResult = {
      success: true,
      testResults: [],
      consoleLogs: []
    }
    
    contextStore.setResponse(contextId, mockResponse)
    contextStore.setTestResult(contextId, mockTestResult)
    
    expect(contextStore.contexts.get(contextId)?.response).toBeDefined()
    expect(contextStore.contexts.get(contextId)?.testResult).toBeDefined()
    
    contextStore.clearResponse(contextId)
    
    expect(contextStore.contexts.get(contextId)?.response).toBeUndefined()
    expect(contextStore.contexts.get(contextId)?.testResult).toBeUndefined()
  })

  it('should export request config correctly', () => {
    const context = contextStore.createContext({
      method: 'POST',
      url: 'https://example.com/api',
      params: [
        { key: 'enabledParam', value: 'value1', enabled: true },
        { key: 'disabledParam', value: 'value2', enabled: false }
      ],
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'X-Disabled', value: 'test', enabled: false }
      ]
    })
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    const config = contextStore.exportConfig(contextId)
    
    expect(config.method).toBe('POST')
    expect(config.url).toBe('https://example.com/api')
    expect(config.params).toHaveLength(1) // 只包含启用的参数
    expect(config.params[0].key).toBe('enabledParam')
    expect(config.headers).toHaveLength(1) // 只包含启用的头部
    expect(config.headers[0].key).toBe('Content-Type')
  })

  it('should clear response and test result for a context', () => {
    const context = contextStore.createContext()
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    contextStore.setActiveContext(contextId)
    contextStore.deleteContext(contextId)
    
    expect(contextStore.contexts.has(contextId)).toBe(false)
    expect(contextStore.activeContextId).toBeNull()
    expect(contextStore.activeContext).toBeNull()
  })

  it('should format response body correctly', () => {
    const context = contextStore.createContext()
    // 获取contextId
    let contextId: string | undefined
    contextStore.contexts.forEach((ctx, id) => {
      if (ctx.request.id === context.request.id) {
        contextId = id
      }
    })
    
    if (!contextId) throw new Error('Context not found')
    
    // 测试JSON格式
    const jsonResponse: Response = {
      id: 'resp-json',
      requestId: context.request.id,
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'success', data: { id: 123 } },
      size: 38,
      duration: 100,
      timestamp: Date.now()
    }
    
    contextStore.setResponse(contextId, jsonResponse)
    contextStore.setActiveContext(contextId)
    
    expect(contextStore.getFormattedBody()).toBe(JSON.stringify(jsonResponse.body, null, 2))
    expect(contextStore.getBodySize()).toBe('38 B')
    expect(contextStore.getDuration()).toBe('100 ms')
    
    // 测试字符串格式
    const textResponse: Response = {
      id: 'resp-text',
      requestId: context.request.id,
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/plain' },
      body: 'Hello World',
      size: 11,
      duration: 1500,
      timestamp: Date.now()
    }
    
    contextStore.setResponse(contextId, textResponse)
    
    expect(contextStore.getFormattedBody()).toBe('Hello World')
    expect(contextStore.getBodySize()).toBe('11 B')
    expect(contextStore.getDuration()).toBe('1.50 s')
  })
})
