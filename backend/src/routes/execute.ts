import { Router } from 'express';
// Assuming engine files will exist
import { tokenize } from '../engine/lexer';
import { parse } from '../engine/parser';
import { instrument } from '../engine/instrumenter';
import { runCode } from '../runner/local';
import { ALLOWED_INCLUDES } from '../engine/traceHeader'; // Assuming this will exist

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
  sandboxWarning: string;
}

const FORBIDDEN_TOKENS = ['system(', 'exec(', 'popen(', 'fork(', '#define', '#pragma', 'asm', '__attribute__'];

router.post('/', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(503).json({ error: 'Production execution disabled: Docker runner is not implemented. Use local development with trusted code.' });
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
        return res.status(400).json({ success: false, compilationError: `Forbidden keyword/token found: ${token}` });
      }
    }

    // Validation for includes could be done using regex if needed
    // Assuming engine parses and extracts them for validation
    
    // Process
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const instrumentedCode = instrument(ast, code);
    
    const runResult = await runCode(instrumentedCode, stdin || '');

    const response: ExecuteResponse = {
      success: runResult.exitCode === 0 && !runResult.timeLimitExceeded && !runResult.stepLimitExceeded,
      trace: runResult.trace,
      stdout: runResult.stdout,
      stepCount: runResult.trace.length,
      executionTimeMs: runResult.executionTimeMs,
      timeLimitExceeded: runResult.timeLimitExceeded,
      stepLimitExceeded: runResult.stepLimitExceeded,
      sandboxWarning: 'Sandbox chưa hoàn chỉnh - dùng Docker cho production'
    };
    
    if (runResult.exitCode !== 0) {
        response.runtimeError = runResult.stderr || `Process exited with code ${runResult.exitCode}`;
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
    return res.json({ success: false, compilationError: 'Lỗi không xác định' });
  }
});

export default router;

