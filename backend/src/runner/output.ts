import { RunResult } from './sandbox.js';
import { TraceEvent } from '../types.js';

export interface RunOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
  timeLimitExceeded: boolean;
  executionTimeMs: number;
  debugTrace: boolean;
  captureTrace: boolean;
  missingDebuggerMessage: string;
}

// Interprets what runner/run.sh printed. Shared by every runner that executes that script,
// so Docker and the in-container sandbox report compiler errors, traces and limits identically.
export function readRunOutput(out: RunOutput): RunResult {
  const { exitCode, stdout, stderr, executionTimeMs } = out;
  const timeLimitExceeded = out.timeLimitExceeded || exitCode === 124;

  if (out.debugTrace) {
    try {
      const result = JSON.parse(stdout);
      if (result.codelensDebugger === 1 && Array.isArray(result.trace)) return { ...result, executionTimeMs };
    } catch { /* Compilation errors use the diagnostics below. */ }
  }

  // run.sh prints a JSON object and exits 65 when compilation fails.
  try {
    const parsed = JSON.parse(stdout);
    if (exitCode === 65 && typeof parsed.compilationError === 'string') {
      const error = new Error(`Compilation failed:\n${parsed.compilationError || 'Compiler stopped before producing diagnostics (check time/memory limits).'}`);
      error.name = 'CompilationError';
      throw error;
    }
  } catch (error: any) {
    if (error?.name === 'CompilationError') throw error;
    // Not JSON: the program compiled and stdout is its own output.
  }

  if (out.debugTrace) {
    return { trace: [], stdout: '', stderr: stderr || out.missingDebuggerMessage,
      exitCode: 1, executionTimeMs, timeLimitExceeded, stepLimitExceeded: false };
  }

  const lines = out.captureTrace ? stderr.split('\n') : [];
  const trace: TraceEvent[] = [];
  let actualStderr = out.captureTrace ? '' : stderr;
  let stepLimitExceeded = false;
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.error === 'STEP_LIMIT') stepLimitExceeded = true;
      else if (event.step !== undefined) trace.push(event);
      else actualStderr += line + '\n';
    } catch {
      actualStderr += line + '\n';
    }
  }
  return { trace, stdout, stderr: actualStderr, exitCode, executionTimeMs, timeLimitExceeded, stepLimitExceeded };
}
