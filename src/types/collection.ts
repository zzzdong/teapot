export interface CollectionItem {
  id: string;
  parentId?: string;
  type: 'collection' | 'folder' | 'request';
  name: string;
  description?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Collection extends CollectionItem {
  type: 'collection';
}

export interface Folder extends CollectionItem {
  type: 'folder';
}

export interface CollectionRequest {
  id: string;
  parentId?: string;
  type: 'request';
  name: string;
  request: any; // Request type from request.ts
  description?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}
