import type { Request } from './request';

export interface WorkspaceTab {
  id: string;
  request: Request;
  isActive: boolean;
  isModified: boolean;
  name: string;
  createdAt: number;
}

export interface WorkspaceTabsState {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}
