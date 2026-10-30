import { Router } from 'express';
import { tokenize } from '../engine/lexer.js';
import { parse } from '../engine/parser.js';
import { instrument } from '../engine/instrumenter.js';
import { LocalRunner } from '../runner/local.js';
import { DockerRunner } from '../runner/dockerRunner.js';
import { BusyError, createGate, isDirectLocal, LOCAL_RUNNER_PUBLIC_ERROR } from '../guard.js';

const router = Router();

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

const gate = createGate(Number(process.env.MAX_CONCURRENT_RUNS || 2), Number(process.env.MAX_QUEUED_RUNS || 8));

router.post('/', async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const useDocker = process.env.RUNNER === 'docker' || isProd;
    
    // LocalRunner has no isolation; a blocklist cannot make arbitrary C++ safe, so never serve it through a proxy.
    if (!useDocker && !isDirectLocal(req)) {
      return res.status(503).json({ success: false, error: LOCAL_RUNNER_PUBLIC_ERROR });
    }
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

    // Native mode sends the original source to GCC; the teaching parser is not a C++ validator.
    let instrumentedCode = code;
    if (mode === 'visualize' && !useDocker) {
      try {
        instrumentedCode = instrument(parse(tokenize(code)), code);
      } catch (error: any) {
        return res.json({ success: false, compilationError:
          `Bộ trực quan hóa chưa xử lý được đoạn code này: ${error.message}. Backend hiện dùng LocalRunner. Build lại image codelens-sandbox và khởi động với RUNNER=docker để trực quan hóa code gốc bằng GCC/GDB.` });
      }
    }
    let runResult;
    try {
      runResult = await gate(() => runner.run(instrumentedCode, stdin || '', {
        standard, captureTrace: mode === 'visualize', debugTrace: mode === 'visualize' && useDocker
      }));
    } catch (error: any) {
      if (mode === 'visualize' && !useDocker && error.name === 'CompilationError') {
        error.message += '\nLỗi trên code đã gắn theo dõi; hãy thử “Chạy C++ / thi đấu” để kiểm tra code gốc.';
      }
      throw error;
    }

    const response: ExecuteResponse & { _instrumentedCode?: string } = {
      executionMode: mode,
      visualizationWarning: mode === 'run' ? 'Đã chạy code gốc bằng GCC. Chế độ này không tạo bản ghi trực quan hóa từng bước.' : useDocker ? 'GCC/GDB theo dõi code gốc theo dòng: trạng thái trước dòng đang tô sáng. Một dòng có nhiều lệnh có thể chỉ có một điểm dừng. Biến tối ưu hóa hoặc kiểu phức tạp có thể không đọc được; mảng/container hiển thị tối đa 100 phần tử. Không có nhãn so sánh/swap tự động.' : undefined,
      stderr: runResult.stderr,
      success: runResult.exitCode === 0 && !runResult.timeLimitExceeded && !runResult.stepLimitExceeded,
      trace: runResult.trace,
      stdout: runResult.stdout,
      stepCount: runResult.trace.length,
      executionTimeMs: runResult.executionTimeMs,
      timeLimitExceeded: runResult.timeLimitExceeded,
      stepLimitExceeded: runResult.stepLimitExceeded,
      _instrumentedCode: useDocker ? undefined : instrumentedCode
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
    if (error instanceof BusyError) {
      return res.status(503).json({ success: false, error: error.message });
    }
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
