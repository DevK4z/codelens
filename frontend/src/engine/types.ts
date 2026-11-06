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
  compareAccesses?: { array: string; index: number }[];
  compareInfo?: { left: string; right: string; leftValue: any; rightValue: any; operator: string; result: boolean };
  heap?: Heap;
}

// Structs reachable through pointers at this step, by address (see runner/gdb_trace.py).
export interface HeapNode { type: string; fields: Record<string, unknown> }
export type Heap = Record<string, HeapNode>;

export interface CallFrame {
  id?: number;
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
  executionMode?: 'run' | 'visualize';
  visualizationWarning?: string;
  stderr?: string;
  isDemo?: boolean;
}

// Resource returned by POST /api/v1/runs and GET /api/v1/runs/{id}.
export type RunStatus = 'succeeded' | 'compile_error' | 'runtime_error' | 'time_limit_exceeded' | 'step_limit_exceeded';
export interface Run {
  id: string;
  status: RunStatus;
  language: 'cpp';
  mode: 'run' | 'visualize';
  standard: 'gnu++17' | 'gnu++20';
  createdAt: string;
  durationMs: number;
  stdout: string;
  stderr: string;
  error: string | null;
  stepCount: number;
  trace: TraceEvent[];
  warnings: { sandbox?: string; visualization?: string };
}

export type VariableRole = 'array' | 'left-pointer' | 'right-pointer' | 'mid-pointer' | 'dp-table' | 'counter' | 'target' | 'result' | 'none';

export interface VariableRoleMap {
  [varName: string]: VariableRole;
}

export type ThemeMode = 'dark' | 'light';

