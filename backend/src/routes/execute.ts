import type { RequestHandler } from 'express';
import { executeRun } from './runs.js';
import { ApiError } from '../problem.js';

// Deprecated RPC contract. Kept so a Pages build from before /api/v1 keeps working while the
// backend, which deploys separately, is updated first. Remove once no client calls it.
export const legacyExecute: RequestHandler = async (req, res) => {
  res.set({ Deprecation: 'true', Link: '</api/v1/runs>; rel="successor-version"' });
  try {
    const run = await executeRun(req);
    res.json({
      success: run.status === 'succeeded',
      trace: run.trace,
      stdout: run.stdout,
      stderr: run.stderr,
      compilationError: run.status === 'compile_error' ? run.error : undefined,
      runtimeError: run.status !== 'succeeded' && run.status !== 'compile_error' ? run.error : undefined,
      stepCount: run.stepCount,
      executionTimeMs: run.durationMs,
      timeLimitExceeded: run.status === 'time_limit_exceeded',
      stepLimitExceeded: run.status === 'step_limit_exceeded',
      executionMode: run.mode,
      visualizationWarning: run.warnings.visualization,
      sandboxWarning: run.warnings.sandbox,
    });
  } catch (error: any) {
    if (!(error instanceof ApiError)) console.error('Execution Error:', error);
    const status = error instanceof ApiError ? (error.status === 415 || error.status === 422 ? 400 : error.status) : 500;
    res.set(error instanceof ApiError ? error.headers : {}).status(status).json({ success: false, error: error.message || 'Lỗi không xác định' });
  }
};
