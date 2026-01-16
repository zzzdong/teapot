import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Collection, Folder, CollectionItem, CollectionRequest } from '@/types/collection';
import type { Request } from '@/types/request';
import * as tauriApi from '@/api/tauri-api';

export const useCollectionsStore = defineStore('collections', () => {
  // State
  const collections = ref<CollectionItem[]>([]);
  const selectedItemId = ref<string | null>(null);
  const expandedItems = ref<Set<string>>(new Set());
  const currentCollectionId = ref<string | null>(null);

  // Computed
  const allItems = computed(() => {
    const items: CollectionItem[] = [];

    // Add all collections first
    collections.value.forEach(collection => {
      items.push(collection);

      // Helper function to recursively collect children
      function collectChildren(parentId: string) {
        const children = collections.value.filter(item => item.parentId === parentId);
        children.forEach(child => {
          items.push(child);
          collectChildren(child.id);
        });
      }

      collectChildren(collection.id);
    });

    return items;
  });

  const selectedItem = computed(() => {
    if (!selectedItemId.value) return null;
    return allItems.value.find(item => item.id === selectedItemId.value) || null;
  });

  const currentCollection = computed(() => {
    if (!currentCollectionId.value) return null;
    return collections.value.find(c => c.id === currentCollectionId.value && c.type === 'collection') || null;
  });

  const collectionOptions = computed(() => {
    return collections.value
      .filter(item => item.type === 'collection')
      .map(collection => ({
        label: collection.name,
        value: collection.id
      }));
  });

  // Helper to get direct children of a parent (not recursive)
  function getDirectChildren(parentId: string): CollectionItem[] {
    return allItems.value.filter(item => item.parentId === parentId);
  }

  // Actions
  function createCollection(name: string, description?: string): Collection {
    const collection: Collection = {
      id: uuidv4(),
      parentId: undefined,
      type: 'collection',
      name,
      description,
      order: collections.value.filter(c => c.type === 'collection').length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    collections.value.push(collection);
    saveToStore();
    return collection;
  }

  function createFolder(parentId: string, name: string, description?: string): Folder {
    const folder: Folder = {
      id: uuidv4(),
      parentId,
      type: 'folder',
      name,
      description,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    expandedItems.value.add(folder.id);
    collections.value.push(folder);
    saveToStore();
    return folder;
  }

  function createRequest(parentId: string, name: string, request: any): CollectionRequest {
    const collectionRequest: CollectionRequest = {
      id: uuidv4(),
      parentId,
      type: 'request',
      name,
      request,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    collections.value.push(collectionRequest);
    saveToStore();
    return collectionRequest;
  }

  function updateItem(id: string, updates: Partial<CollectionItem>) {
    const item = findItem(id);
    if (item) {
      Object.assign(item, updates, { updatedAt: Date.now() });
      saveToStore();
    }
  }

  function deleteItem(id: string) {
    // Find and delete the item and all its children
    const children = [id];
    let i = 0;
    while (i < children.length) {
      const childId = children[i];
      const childItems = allItems.value.filter(item => item.parentId === childId);
      childItems.forEach(child => children.push(child.id));
      i++;
    }

    // Delete from collections array
    collections.value = collections.value.filter(item => !children.includes(item.id));

    saveToStore();
  }

  function duplicateItem(id: string) {
    const item = findItem(id);
    if (!item) return;

    const newItem = JSON.parse(JSON.stringify(item));
    newItem.id = uuidv4();
    newItem.name = `${item.name} (Copy)`;
    newItem.createdAt = Date.now();
    newItem.updatedAt = Date.now();

    if (newItem.type === 'collection') {
      collections.value.push(newItem);
    }
    // For folders and requests, we need to store them separately
    // This is a simplified implementation

    saveToStore();
  }

  function moveItem(id: string, newParentId?: string) {
    const item = findItem(id);
    if (item && item.id !== newParentId) {
      item.parentId = newParentId;
      item.updatedAt = Date.now();
      saveToStore();
    }
  }

  function findItem(id: string): CollectionItem | null {
    return collections.value.find(c => c.id === id) || null;
  }

  function findRequestByRequestId(requestId: string): CollectionRequest | null {
    const item = collections.value.find(item => {
      if (item.type !== 'request') return false;
      const requestItem = item as CollectionRequest;
      return requestItem.request?.id === requestId;
    });
    return item as CollectionRequest | null;
  }

  function findAncestorCollection(itemId: string): string | null {
    const item = findItem(itemId);
    if (!item) return null;
    
    if (item.type === 'collection') {
      return item.id;
    }
    
    // 对于文件夹或请求，向上查找祖先collection
    let currentItem: CollectionItem | null = item;
    while (currentItem && currentItem.type !== 'collection') {
      currentItem = currentItem.parentId ? findItem(currentItem.parentId) : null;
    }
    
    return currentItem ? currentItem.id : null;
  }

  function updateRequest(requestId: string, updates: Partial<Request>) {
    const collectionRequest = findRequestByRequestId(requestId);
    if (!collectionRequest) return;
    
    // 更新请求数据
    collectionRequest.request = { ...collectionRequest.request, ...updates };
    collectionRequest.updatedAt = Date.now();
    
    // 如果名称更新了，也更新集合项名称
    if (updates.name) {
      collectionRequest.name = updates.name;
    }
    
    saveToStore();
  }

  function setSelectedItem(id: string | null) {
    selectedItemId.value = id;
  }

  function setCurrentCollection(id: string | null) {
    currentCollectionId.value = id;
    saveToStore();
  }

  function toggleExpanded(id: string) {
    if (expandedItems.value.has(id)) {
      expandedItems.value.delete(id);
    } else {
      expandedItems.value.add(id);
    }
  }

  function setExpanded(id: string, expanded: boolean) {
    if (expanded) {
      expandedItems.value.add(id);
    } else {
      expandedItems.value.delete(id);
    }
  }

  function expandAll() {
    allItems.value.forEach(item => {
      if (item.type === 'folder' || item.type === 'collection') {
        expandedItems.value.add(item.id);
      }
    });
  }

  function collapseAll() {
    expandedItems.value.clear();
  }

  function reorderItems(sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') {
    // Implement drag and drop reordering
    const sourceItem = findItem(sourceId);
    const targetItem = findItem(targetId);

    if (!sourceItem || !targetItem) return;

    if (position === 'inside') {
      sourceItem.parentId = targetItem.id;
    } else {
      sourceItem.parentId = targetItem.parentId;
      // Reorder logic here
    }

    sourceItem.updatedAt = Date.now();
    saveToStore();
  }

  function exportCollection(id: string): CollectionItem | null {
    const collection = collections.value.find(c => c.id === id);
    return collection ? { ...collection } : null;
  }

  function importCollection(collection: CollectionItem) {
    const existing = collections.value.find(c => c.id === collection.id);
    if (existing) {
      const index = collections.value.indexOf(existing);
      collections.value[index] = { ...collection };
    } else {
      collections.value.push({ ...collection });
    }
    saveToStore();
  }

  function exportAllCollections(): CollectionItem[] {
    return collections.value.map(c => ({ ...c }));
  }

  function importAllCollections(collectionsToImport: Collection[]) {
    collectionsToImport.forEach(collection => {
      importCollection(collection);
    });
  }

  async function saveToStore() {
    try {
      const api = tauriApi;

      if (api) {
        api.store.set('collections', collections.value);
        api.store.set('expandedItems', Array.from(expandedItems.value));
        api.store.set('currentCollectionId', currentCollectionId.value);
      }
    } catch (error) {
      console.error('Failed to save collections:', error);
    }
  }

  async function loadFromStore() {
    try {
      const api = tauriApi;

      if (api) {
        const stored = api.store.get('collections');
        if (stored instanceof Promise) {
          const value = await stored;
          if (value) {
            collections.value = value.map((c: any) => ({
              ...c,
              createdAt: c.createdAt || Date.now(),
              updatedAt: c.updatedAt || Date.now()
            }));
          }
        }

        const expanded = api.store.get('expandedItems');
        if (expanded instanceof Promise) {
          const value = await expanded;
          if (value) {
            expandedItems.value = new Set(value);
          }
        }

        const currentId = api.store.get('currentCollectionId');
        if (currentId instanceof Promise) {
          const value = await currentId;
          if (value) {
            currentCollectionId.value = value;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  return {
    // State
    collections,
    selectedItemId,
    expandedItems,
    currentCollectionId,
    // Computed
    allItems,
    selectedItem,
    currentCollection,
    collectionOptions,
    // Helpers
    getDirectChildren,
    findAncestorCollection,
    // Request helpers
    findRequestByRequestId,
    updateRequest,
    // Actions
    createCollection,
    createFolder,
    createRequest,
    updateItem,
    deleteItem,
    duplicateItem,
    moveItem,
    findItem,
    setSelectedItem,
    setCurrentCollection,
    toggleExpanded,
    setExpanded,
    expandAll,
    collapseAll,
    reorderItems,
    exportCollection,
    importCollection,
    exportAllCollections,
    importAllCollections,
    saveToStore,
    loadFromStore
  };
});
