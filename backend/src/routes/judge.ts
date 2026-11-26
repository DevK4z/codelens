import { Router, type Request, type RequestHandler } from 'express';
import { createRunner, runnerKind } from '../runner/select.js';
import { BusyError, isDirectLocal, LOCAL_RUNNER_PUBLIC_ERROR } from '../guard.js';
import { ApiError, methodNotAllowed } from '../problem.js';
import { gate } from './runs.js';
import { LANGUAGES, isLanguage, type Language } from '../runner/languages.js';

// Grades one submission against a set of test cases in a single request: one rate-limit hit and one
// queue slot instead of one per test. SandboxRunner caches the build by source, so only the first
// test pays for compilation.

export type JudgeVerdict = 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'finished';

export interface JudgeTestResult {
  verdict: JudgeVerdict;
  durationMs: number;
  stdout: string; // first PREVIEW_CHARS characters
  stderr: string;
}

export interface JudgeResponse {
  status: 'completed' | 'compile_error';
  error: string | null;
  durationMs: number;
  tests: JudgeTestResult[];
}

const MAX_TESTS = 30;
const MAX_STDIN = 10_000;
const MAX_EXPECTED = 64_000;
const PREVIEW_CHARS = 2_000;
// Exam programs are plain native runs; a short per-test limit keeps a looping submission from
// holding the only queue slot for minutes (RUN_TIMEOUT_MS is sized for GDB stepping).
const JUDGE_TIMEOUT_MS = Number(process.env.JUDGE_TIMEOUT_MS || 5000);

const invalid = (detail: string) => new ApiError(422, 'invalid_judge', detail);

/** Contest-style comparison: ignore trailing spaces on each line and trailing blank lines. */
export function normalizeOutput(text: string): string {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

const preview = (text: string) => (text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text);

function readBody(req: Request) {
  if (!req.is('application/json')) throw new ApiError(415, 'unsupported_media_type', 'Gửi body dạng application/json.');
  const { code, language, standard = 'gnu++17', tests } = req.body ?? {};
  if (!isLanguage(language)) throw invalid(`language phải là một trong: ${LANGUAGES.join(', ')}.`);
  if (!['gnu++17', 'gnu++20'].includes(standard)) throw invalid('standard phải là "gnu++17" hoặc "gnu++20".');
  if (typeof code !== 'string' || !code) throw invalid('code phải là chuỗi không rỗng.');
  if (code.length > 50000) throw invalid('code vượt giới hạn 50KB.');
  if (!Array.isArray(tests) || tests.length === 0 || tests.length > MAX_TESTS) throw invalid(`tests phải là mảng 1–${MAX_TESTS} phần tử.`);
  const cases = tests.map((t: unknown, i: number) => {
    const { stdin = '', expected } = (t ?? {}) as { stdin?: unknown; expected?: unknown };
    if (typeof stdin !== 'string' || stdin.length > MAX_STDIN) throw invalid(`tests[${i}].stdin phải là chuỗi tối đa 10KB.`);
    if (expected !== undefined && (typeof expected !== 'string' || expected.length > MAX_EXPECTED))
      throw invalid(`tests[${i}].expected phải là chuỗi tối đa 64KB.`);
    return { stdin, expected: expected as string | undefined };
  });
  return { code, language: language as Language, standard: standard as 'gnu++17' | 'gnu++20', cases };
}

export async function judge(req: Request): Promise<JudgeResponse> {
  const kind = runnerKind();
  // LocalRunner has no isolation, so it only judges for the developer's own machine.
  if (kind === 'local' && !isDirectLocal(req)) throw new ApiError(503, 'local_runner_not_public', LOCAL_RUNNER_PUBLIC_ERROR);
  const { code, language, standard, cases } = readBody(req);
  const runner = createRunner(kind);
  const started = Date.now();
  try {
    return await gate(async () => {
      const tests: JudgeTestResult[] = [];
      for (const { stdin, expected } of cases) {
        let result;
        try {
          result = await runner.run(code, stdin, {
            language, standard, captureTrace: false, debugTrace: false, timeoutMs: JUDGE_TIMEOUT_MS, maxOutputBytes: 1024 * 1024,
          });
        } catch (error: any) {
          if (error?.name === 'CompilationError' || error?.name === 'ParseError')
            return { status: 'compile_error' as const, error: error.message, durationMs: Date.now() - started, tests: [] };
          if (error?.name !== 'RunError') throw error;
          tests.push({ verdict: 'runtime_error', durationMs: 0, stdout: '', stderr: preview(String(error.message)) });
          continue;
        }
        const verdict: JudgeVerdict = result.timeLimitExceeded ? 'time_limit_exceeded'
          : result.exitCode !== 0 ? 'runtime_error'
          : expected === undefined ? 'finished'
          : normalizeOutput(result.stdout) === normalizeOutput(expected) ? 'accepted' : 'wrong_answer';
        tests.push({ verdict, durationMs: result.executionTimeMs, stdout: preview(result.stdout), stderr: preview(result.stderr) });
      }
      return { status: 'completed' as const, error: null, durationMs: Date.now() - started, tests };
    });
  } catch (error) {
    if (error instanceof BusyError) throw new ApiError(503, 'runner_busy', error.message, { 'Retry-After': '5' });
    throw error;
  }
}

export function createJudgeRouter(limiter: RequestHandler) {
  const router = Router();
  router.route('/')
    .post(limiter, async (req, res) => { res.set('Cache-Control', 'no-store').json(await judge(req)); })
    .all(methodNotAllowed('POST'));
  return router;
}
