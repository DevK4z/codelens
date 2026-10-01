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
  executionMode?: 'run' | 'visualize';
  visualizationWarning?: string;
  stderr?: string;
}

const FORBIDDEN_TOKENS = ['system(', 'exec(', 'popen(', 'fork(', '__attribute__'];

router.post('/', async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const useDocker = process.env.RUNNER === 'docker' || isProd;
    
    // Check docker availability early in production
    const runner = useDocker ? new DockerRunner() : new LocalRunner();

    const { code, stdin, language, mode = 'visualize', standard = 'gnu++17' } = req.body || {};
    if (!['run', 'visualize'].includes(mode) || !['gnu++17', 'gnu++20'].includes(standard)) {
      return res.status(400).json({ success: false, compilationError: 'Invalid execution mode or C++ standard.' });
    }
    if (mode === 'run' && !useDocker) {
      return res.status(400).json({ success: false, runtimeError: 'Chế độ C++ trực tiếp cần Docker. Khởi động backend với RUNNER=docker.' });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, compilationError: 'Code must be a non-empty string' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ success: false, compilationError: 'Code exceeds 50KB limit' });
    }
    if (stdin !== undefined && (typeof stdin !== 'string' || stdin.length > 10000)) {
      return res.status(400).json({ success: false, compilationError: 'Stdin must be a string up to 10KB' });
    }
    if (language !== 'cpp') {
      return res.status(400).json({ success: false, compilationError: 'Language must be cpp' });
    }

    for (const token of (mode === 'visualize' ? FORBIDDEN_TOKENS : [])) {
      if (code.includes(token)) {
        return res.status(400).json({ success: false, compilationError: `Forbidden keyword/token found: ${token}` });
      }
    }

    // Native mode sends the original source to GCC; the teaching parser is not a C++ validator.
    let instrumentedCode = code;
    if (mode === 'visualize') {
      try {
        instrumentedCode = instrument(parse(tokenize(code)), code);
      } catch (error: any) {
        return res.json({ success: false, compilationError:
          `Bộ trực quan hóa chưa xử lý được đoạn code này: ${error.message}. Hãy chọn “Chạy C++ / thi đấu” để GCC biên dịch code gốc.` });
      }
    }
    let runResult;
    try {
      runResult = await runner.run(instrumentedCode, stdin || '', {
        standard, captureTrace: mode === 'visualize'
      });
    } catch (error: any) {
      if (mode === 'visualize' && error.name === 'CompilationError') {
        error.message += '\nLỗi trên code đã gắn theo dõi; hãy thử “Chạy C++ / thi đấu” để kiểm tra code gốc.';
      }
      throw error;
    }

    const response: ExecuteResponse & { _instrumentedCode?: string } = {
      executionMode: mode,
      visualizationWarning: mode === 'run' ? 'Đã chạy code gốc bằng GCC. Chế độ này không tạo bản ghi trực quan hóa từng bước.' : undefined,
      stderr: runResult.stderr,
      success: runResult.exitCode === 0 && !runResult.timeLimitExceeded && !runResult.stepLimitExceeded,
      trace: runResult.trace,
      stdout: runResult.stdout,
      stepCount: runResult.trace.length,
      executionTimeMs: runResult.executionTimeMs,
      timeLimitExceeded: runResult.timeLimitExceeded,
      stepLimitExceeded: runResult.stepLimitExceeded,
      _instrumentedCode: instrumentedCode
    };
    
    if (runResult.exitCode !== 0 || runResult.timeLimitExceeded || runResult.stepLimitExceeded) {
        response.runtimeError = runResult.timeLimitExceeded ? 'Chương trình vượt giới hạn thời gian.' : runResult.stepLimitExceeded ? 'Chương trình vượt giới hạn số bước.' : runResult.stderr || `Process exited with code ${runResult.exitCode}`;
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
