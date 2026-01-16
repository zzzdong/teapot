export interface WebSocketMessage {
  id: string;
  connectionId: string;
  type: 'sent' | 'received';
  data: string;
  format: 'text' | 'json' | 'binary';
  timestamp: number;
}

export interface WebSocketConnection {
  id: string;
  url: string;
  protocols?: string[];
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  messages: WebSocketMessage[];
  createdAt: number;
  lastActivity?: number;
}

export interface WebSocketSettings {
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatEnabled: boolean;
  heartbeatInterval: number;
  heartbeatMessage: string;
}
