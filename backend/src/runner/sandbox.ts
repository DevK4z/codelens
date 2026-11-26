import { TraceEvent } from '../types.js';
import type { Language } from './languages.js';

export interface RunResult {
  trace: TraceEvent[];
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timeLimitExceeded: boolean;
  stepLimitExceeded: boolean;
}

export interface RunLimits {
  /** Defaults to cpp. Anything else is a plain run: no trace, no debugger. */
  language?: Language;
  standard?: 'gnu++17' | 'gnu++20';
  captureTrace?: boolean;
  debugTrace?: boolean;
  timeoutMs: number;      // default 5000
  maxOutputBytes: number;  // default 10MB
  maxSteps: number;        // default 10000
}

export interface Runner {
  run(instrumentedCode: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult>;
}

