export interface IpcApi {
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    delete: (key: string) => void;
    clear: () => void;
    has: (key: string) => boolean;
  };
  request: {
    send: (config: any) => Promise<any>;
    cancel?: (id: string) => Promise<void>;
  };
  websocket: {
    connect: (url: string, protocols?: string[]) => Promise<string>;
    send: (id: string, data: string) => Promise<void>;
    close: (id: string) => Promise<void>;
  };
  file: {
    read: (path: string) => Promise<string>;
    write: (path: string, data: string) => Promise<void>;
    selectFile?: (filters?: any[]) => Promise<string | null>;
    selectDirectory?: () => Promise<string | null>;
    select?: () => Promise<string | null>;
  };
  script: {
    execute: (code: string, context: any) => Promise<any>;
  };
  env: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
}

declare global {
  interface Window {
    __TAURI__?: any;
  }
}
