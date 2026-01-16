export interface AppSettings {
  general: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    editorTheme: string;
  };
  network: {
    proxy?: {
      enabled: boolean;
      host: string;
      port: number;
      username?: string;
      password?: string;
      protocol: 'http' | 'https' | 'socks5';
    };
    sslVerification: boolean;
    timeout: number;
    maxRedirects: number;
    followRedirects: boolean;
  };
  editor: {
    wordWrap: boolean;
    showLineNumbers: boolean;
    minimap: boolean;
    fontSize: number;
    tabSize: number;
    autoFormat: boolean;
  };
  history: {
    maxItems: number;
    autoSave: boolean;
    saveResponses: boolean;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
}

export type SettingKey = keyof AppSettings;
