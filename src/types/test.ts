export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

export interface TestSuite {
  requestId: string;
  results: TestResult[];
  total: number;
  passed: number;
  failed: number;
  duration: number;
  timestamp: number;
}

export interface TestAssertion {
  type: string;
  expression: string;
  expected?: any;
  operator?: string;
}
