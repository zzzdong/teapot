export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestParam {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface RequestHeader {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';

export type RawBodyType = 'text' | 'json' | 'xml' | 'html' | 'javascript';

export interface FormDataItem {
  key: string;
  value: string;
  type: 'text' | 'file';
  description?: string;
  enabled: boolean;
  file?: File | null;
}

export interface GraphQLQuery {
  query: string;
  variables: string;
}

export interface RequestBody {
  type: BodyType;
  rawType?: RawBodyType;
  raw?: string;
  formData?: FormDataItem[];
  urlencoded?: RequestParam[];
  graphql?: GraphQLQuery;
  binary?: File | null;
}

export interface AuthConfig {
  type: 'noauth' | 'bearer' | 'basic' | 'digest' | 'oauth1' | 'oauth2' | 'apikey' | 'aws4';
  config: Record<string, any>;
}

export interface PreRequestScript {
  enabled: boolean;
  content: string;
}

export interface TestScript {
  enabled: boolean;
  content: string;
}

export interface Request {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: RequestParam[];
  headers: RequestHeader[];
  body: RequestBody;
  auth: AuthConfig;
  preRequestScript: PreRequestScript;
  testScript: TestScript;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RequestConfig {
  id?: string;
  method: HttpMethod;
  url: string;
  params?: RequestParam[];
  headers?: RequestHeader[];
  body?: RequestBody;
  auth?: AuthConfig;
  timeout?: number;
  maxRedirects?: number;
}
