import { describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

// Global test setup
globalThis.describe = describe
globalThis.expect = expect
globalThis.it = it
globalThis.vi = vi

// Mock Tauri API
globalThis.__TAURI__ = {
  http: {
    request: vi.fn(() => Promise.resolve({
      status: 200,
      headers: {},
      data: {},
      url: ''
    }))
  },
  store: {
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn(),
    clear: vi.fn()
  }
}

// Helper functions for testing
export function createTestPinia() {
  return createPinia()
}

export function mountComponent(component: any, options: any = {}) {
  return mount(component, {
    global: {
      plugins: [createTestPinia()],
      ...options.global
    },
    ...options
  })
}
