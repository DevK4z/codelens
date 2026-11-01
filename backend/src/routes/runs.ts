import { Router, type Request, type RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { tokenize } from '../engine/lexer.js';
import { parse } from '../engine/parser.js';
import { instrument } from '../engine/instrumenter.js';
import { createRunner, runnerKind } from '../runner/select.js';
import { BusyError, createGate, isDirectLocal, LOCAL_RUNNER_PUBLIC_ERROR } from '../guard.js';
import { ApiError, methodNotAllowed } from '../problem.js';
import type { Run, RunStatus } from '../types.js';

const gate = createGate(Number(process.env.MAX_CONCURRENT_RUNS || 2), Number(process.env.MAX_QUEUED_RUNS || 8));

// Runs stay readable for a short while so GET /runs/{id} works; nothing is persisted and the source is not kept.
const RUN_TTL_MS = 15 * 60_000;
const MAX_STORED_RUNS = 100;
const stored = new Map<string, { run: Run; expires: number }>();

function remember(run: Run): Run {
  const now = Date.now();
  // Insertion order is age order, so expired or excess runs are always at the front.
  for (const [id, entry] of stored) {
    if (entry.expires > now && stored.size < MAX_STORED_RUNS) break;
    stored.delete(id);
  }
  stored.set(run.id, { run, expires: now + RUN_TTL_MS });
  return run;
}

const RUN_MODE_WARNING = 'Đã chạy code gốc bằng GCC. Chế độ này không tạo bản ghi trực quan hóa từng bước.';
const GDB_TRACE_WARNING = 'GCC/GDB theo dõi code gốc theo dòng: trạng thái trước dòng đang tô sáng. Một dòng có nhiều lệnh có thể chỉ có một điểm dừng. Biến tối ưu hóa hoặc kiểu phức tạp có thể không đọc được; mảng/container hiển thị tối đa 100 phần tử. Không có nhãn so sánh/swap tự động.';
const LOCAL_SANDBOX_WARNING = 'Đang chạy LocalRunner. Chế độ này không cách ly bảo mật và chỉ dùng cho development.';

const invalid = (detail: string) => new ApiError(422, 'invalid_run', detail);

export async function executeRun(req: Request): Promise<Run> {
  const kind = runnerKind();
  const isolated = kind !== 'local';
  // LocalRunner has no isolation; a blocklist cannot make arbitrary C++ safe, so never serve it through a proxy.
  if (!isolated && !isDirectLocal(req)) throw new ApiError(503, 'local_runner_not_public', LOCAL_RUNNER_PUBLIC_ERROR);
  if (!req.is('application/json')) throw new ApiError(415, 'unsupported_media_type', 'Gửi body dạng application/json.');

  const { code, stdin = '', language, mode = 'visualize', standard = 'gnu++17' } = req.body ?? {};
  if (language !== 'cpp') throw invalid('language phải là "cpp".');
  if (!['run', 'visualize'].includes(mode)) throw invalid('mode phải là "run" hoặc "visualize".');
  if (!['gnu++17', 'gnu++20'].includes(standard)) throw invalid('standard phải là "gnu++17" hoặc "gnu++20".');
  if (typeof code !== 'string' || !code) throw invalid('code phải là chuỗi không rỗng.');
  if (code.length > 50000) throw invalid('code vượt giới hạn 50KB.');
  if (typeof stdin !== 'string' || stdin.length > 10000) throw invalid('stdin phải là chuỗi tối đa 10KB.');
  if (mode === 'run' && !isolated) throw new ApiError(422, 'mode_unavailable', 'Chế độ C++ trực tiếp cần runner cô lập. Khởi động backend với RUNNER=docker hoặc RUNNER=sandbox.');

  const base = { id: uuidv4(), language: 'cpp' as const, mode, standard, createdAt: new Date().toISOString() };
  const warnings: Run['warnings'] = {
    visualization: mode === 'run' ? RUN_MODE_WARNING : isolated ? GDB_TRACE_WARNING : undefined,
    sandbox: isolated ? undefined : LOCAL_SANDBOX_WARNING,
  };
  const failed = (status: RunStatus, error: string): Run =>
    ({ ...base, status, durationMs: 0, stdout: '', stderr: '', error, stepCount: 0, trace: [], warnings });

  // Native mode sends the original source to GCC; the teaching parser is not a C++ validator.
  let source = code;
  if (mode === 'visualize' && !isolated) {
    try {
      source = instrument(parse(tokenize(code)), code);
    } catch (error: any) {
      return remember(failed('compile_error',
        `Bộ trực quan hóa chưa xử lý được đoạn code này: ${error.message}. Backend hiện dùng LocalRunner. Build lại image codelens-sandbox và khởi động với RUNNER=docker để trực quan hóa code gốc bằng GCC/GDB.`));
    }
  }

  const runner = createRunner(kind);
  let result;
  try {
    result = await gate(() => runner.run(source, stdin, {
      standard, captureTrace: mode === 'visualize', debugTrace: mode === 'visualize' && isolated,
    }));
  } catch (error: any) {
    if (error instanceof BusyError) throw new ApiError(503, 'runner_busy', error.message, { 'Retry-After': '5' });
    if (error.name === 'CompilationError' || error.name === 'ParseError') {
      const hint = mode === 'visualize' && !isolated && error.name === 'CompilationError'
        ? '\nLỗi trên code đã gắn theo dõi; hãy thử “Chạy C++ / thi đấu” để kiểm tra code gốc.' : '';
      return remember(failed('compile_error', error.message + hint));
    }
    if (error.name === 'RunError') return remember(failed('runtime_error', error.message));
    throw error;
  }

  const status: RunStatus = result.timeLimitExceeded ? 'time_limit_exceeded'
    : result.stepLimitExceeded ? 'step_limit_exceeded'
    : result.exitCode !== 0 ? 'runtime_error' : 'succeeded';
  const error = status === 'time_limit_exceeded' ? 'Chương trình vượt giới hạn thời gian.'
    : status === 'step_limit_exceeded' ? 'Chương trình vượt giới hạn số bước.'
    : status === 'runtime_error' ? result.stderr || `Process exited with code ${result.exitCode}` : null;
  return remember({
    ...base, status, durationMs: result.executionTimeMs, stdout: result.stdout, stderr: result.stderr,
    error, stepCount: result.trace.length, trace: result.trace, warnings,
  });
}

export function createRunsRouter(limiter: RequestHandler) {
  const router = Router();
  router.route('/')
    .post(limiter, async (req, res) => {
      const run = await executeRun(req);
      res.status(201).location(`${req.baseUrl}/${run.id}`).json(run);
    })
    .all(methodNotAllowed('POST'));
  router.route('/:id')
    .get((req, res) => {
      const entry = stored.get(req.params.id);
      if (!entry || entry.expires <= Date.now()) throw new ApiError(404, 'run_not_found', 'Không tìm thấy run hoặc run đã hết hạn (lưu 15 phút).');
      res.json(entry.run);
    })
    .all(methodNotAllowed('GET'));
  return router;
}
