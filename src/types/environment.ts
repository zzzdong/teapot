export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
  secret?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  createdAt: number;
  updatedAt: number;
}

export type VariableScope = 'global' | 'environment' | 'collection' | 'local';

export interface DynamicVariable {
  key: string;
  generator: () => string | number | boolean;
}
