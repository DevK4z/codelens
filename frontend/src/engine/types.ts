export type TraceEventType = 'line' | 'vardecl' | 'assign' | 'call' | 'return' | 'read' | 'write' | 'compare' | 'swap' | 'stdout' | 'stdin' | 'branch' | 'loop_start' | 'loop_end';

export interface TraceEvent {
  step: number;
  line: number;
  event: string;
  callStack: CallFrame[];
  variables: Record<string, any>;
  changed: string[];
  detail?: string;
  stdout?: string;
  arrayAccess?: { array: string; index: number; mode: 'read' | 'write'; value?: any };
  swapInfo?: { array: string; index1: number; index2: number };
  compareInfo?: { left: string; right: string; leftValue: any; rightValue: any; operator: string; result: boolean };
}

export interface CallFrame {
  func: string;
  line: number;
  params?: Record<string, any>;
  returnValue?: any;
}

export interface ExecuteResponse {
  success: boolean;
  trace: TraceEvent[];
  stdout: string;
  compilationError?: string;
  runtimeError?: string;
  stepCount: number;
  executionTimeMs: number;
  timeLimitExceeded?: boolean;
  stepLimitExceeded?: boolean;
  sandboxWarning?: string;
  isDemo?: boolean;
}

export type VariableRole = 'array' | 'left-pointer' | 'right-pointer' | 'mid-pointer' | 'dp-table' | 'counter' | 'target' | 'result' | 'none';

export interface VariableRoleMap {
  [varName: string]: VariableRole;
}

export type ThemeMode = 'dark' | 'light';

