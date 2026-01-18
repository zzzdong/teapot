import type { Request } from './request';
import type { Response } from './response';
import type { ScriptResult } from './script';

/**
 * Represents a complete request-response-test context
 * Contains all information about a single API request cycle
 */
export interface RequestContext {
  // Request information
  request: Request;

  // Response information (optional - may not have been sent yet)
  response?: Response;

  // Test information (optional - may not have tests or tests may not have run)
  testResult?: ScriptResult;

  // Timestamps
  requestSentAt?: number;
  responseReceivedAt?: number;
}

/**
 * Represents a workspace tab with a complete request context
 */
export interface WorkspaceTab {
  id: string;
  context: RequestContext;
  isActive: boolean;
  isModified: boolean;
  name: string;
  createdAt: number;
}

export interface WorkspaceTabsState {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}
