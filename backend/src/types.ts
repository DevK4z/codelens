export interface TraceEvent {
  step: number;
  line: number;
  event: string;
  callStack: { func: string; line: number; params?: Record<string, any> }[];
  variables: Record<string, any>;
  changed: string[];
  detail?: string;
  stdout?: string;
  arrayAccess?: { name: string; index: number; action: 'read' | 'write'; value: any };
  swapInfo?: { name: string; i: number; j: number };
  compareInfo?: { left: string; right: string; leftValue: any; rightValue: any; operator: string; result: boolean };
  heap?: Record<string, { type: string; fields: Record<string, any> }>;
}

export type RunMode = 'run' | 'visualize';
export type CppStandard = 'gnu++17' | 'gnu++20';
// Compiler and program failures are outcomes of a run that did happen, not HTTP errors.
export type RunStatus = 'succeeded' | 'compile_error' | 'runtime_error' | 'time_limit_exceeded' | 'step_limit_exceeded';

export interface Run {
  id: string;
  status: RunStatus;
  language: 'cpp';
  mode: RunMode;
  standard: CppStandard;
  createdAt: string;
  durationMs: number;
  stdout: string;
  stderr: string;
  error: string | null;
  stepCount: number;
  trace: TraceEvent[];
  warnings: { sandbox?: string; visualization?: string };
}
