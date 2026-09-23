import { TraceEvent } from '../routes/execute.js';

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
  timeoutMs: number;      // default 5000
  maxOutputBytes: number;  // default 10MB
  maxSteps: number;        // default 10000
}

export interface Runner {
  run(instrumentedCode: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult>;
}

