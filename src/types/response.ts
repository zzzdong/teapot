export interface Response {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  size: number;
  duration: number;
  timestamp: number;
}

export type ResponseViewType = 'pretty' | 'raw' | 'preview';

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}
