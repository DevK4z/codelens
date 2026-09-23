import { Router } from 'express';
import { tokenize } from '../engine/lexer.js';
import { parse } from '../engine/parser.js';
import { instrument } from '../engine/instrumenter.js';
import { LocalRunner } from '../runner/local.js';
import { DockerRunner } from '../runner/dockerRunner.js';

const router = Router();

export interface TraceEvent {
  step: number;
  line: number;
  event: string;
  callStack: { func: string; line: number }[];
  variables: Record<string, any>;
  changed: string[];
  detail?: string;
  stdout?: string;
  arrayAccess?: { name: string; index: number; action: 'read' | 'write'; value: any };
  swapInfo?: { name: string; i: number; j: number };
  compareInfo?: { left: string; right: string; leftValue: any; rightValue: any; operator: string; result: boolean };
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
}

const FORBIDDEN_TOKENS = ['system(', 'exec(', 'popen(', 'fork(', '#define', '#pragma', 'asm', '__attribute__'];

router.post('/', async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const useDocker = process.env.RUNNER === 'docker' || isProd;
    
    // Check docker availability early in production
    const runner = useDocker ? new DockerRunner() : new LocalRunner();

    const { code, stdin, language } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, compilationError: 'Code must be a non-empty string' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ success: false, compilationError: 'Code exceeds 50KB limit' });
    }
    if (stdin && (typeof stdin !== 'string' || stdin.length > 10000)) {
      return res.status(400).json({ success: false, compilationError: 'Stdin must be a string up to 10KB' });
    }
    if (language !== 'cpp') {
      return res.status(400).json({ success: false, compilationError: 'Language must be cpp' });
    }

    for (const token of FORBIDDEN_TOKENS) {
      if (code.includes(token)) {
        return res.status(400).json({ success: false, compilationError: \Forbidden keyword/token found: \\ });
      }
    }

    const tokens = tokenize(code);
    const ast = parse(tokens);
    const instrumentedCode = instrument(ast, code);
    
    const runResult = await runner.run(instrumentedCode, stdin || '');

    const response: ExecuteResponse & { _instrumentedCode?: string } = {
      success: runResult.exitCode === 0 && !runResult.timeLimitExceeded && !runResult.stepLimitExceeded,
      trace: runResult.trace,
      stdout: runResult.stdout,
      stepCount: runResult.trace.length,
      executionTimeMs: runResult.executionTimeMs,
      timeLimitExceeded: runResult.timeLimitExceeded,
      stepLimitExceeded: runResult.stepLimitExceeded,
      _instrumentedCode: instrumentedCode
    };
    
    if (runResult.exitCode !== 0) {
        response.runtimeError = runResult.stderr || \Process exited with code \\;
    }

    // Add sandbox warning if running locally in production (should not happen if RUNNER=docker is enforced)
    if (!useDocker) {
        response.sandboxWarning = 'Đang chạy LocalRunner. Chế độ này không cách ly bảo mật và chỉ dùng cho development.';
    }

    return res.json(response);

  } catch (error: any) {
    if (error.name === 'ParseError' || error.name === 'CompilationError') {
      return res.json({ success: false, compilationError: error.message });
    }
    if (error.name === 'RunError') {
      return res.json({ success: false, runtimeError: error.message });
    }
    console.error('Execution Error:', error);
    return res.json({ success: false, compilationError: error.message || 'Lỗi không xác định' });
  }
});

export default router;
