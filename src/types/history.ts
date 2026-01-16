import { Request } from './request';
import { Response } from './response';

export interface HistoryItem {
  id: string;
  name: string;
  request: Request;
  response?: Response;
  timestamp: number;
  favorited: boolean;
  executionCount: number;
  lastExecutionAt?: number;
}

export interface HistoryFilter {
  method?: string;
  url?: string;
  status?: string;
  startDate?: number;
  endDate?: number;
  favorited?: boolean;
}
