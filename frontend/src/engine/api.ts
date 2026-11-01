import type { ExecuteResponse, Run } from './types.ts';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const configured = (env?.VITE_API_BASE_URL || env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
const isLocalPage = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_BASE = configured || (isLocalPage ? 'http://localhost:3001/api' : '');

const isJson = (res: Response) => /[/+]json\b/.test(res.headers.get('content-type') ?? '');

// Turns an RFC 9457 problem response into a message the learner can act on.
async function problemMessage(res: Response): Promise<string> {
  const problem = isJson(res) ? await res.json().catch(() => null) : null;
  if (typeof problem?.detail === 'string' && problem.detail) return problem.detail;
  if (res.status === 404) return 'Sai đường dẫn API (404 Not Found). Kiểm tra VITE_API_BASE_URL có đuôi /api.';
  if (res.status === 405) return 'Endpoint không chấp nhận phương thức này (405). Có thể URL đang trỏ tới trang tĩnh.';
  if (res.status === 429) return 'Bạn gửi quá nhiều yêu cầu. Thử lại sau ít phút.';
  if (res.status === 503) return 'Backend chưa sẵn sàng hoặc runner chưa khả dụng (503 Service Unavailable).';
  if (!isJson(res)) return 'Backend trả về dữ liệu HTML thay vì JSON. Kiểm tra lại cấu hình VITE_API_BASE_URL.';
  return `Lỗi máy chủ: HTTP ${res.status}.`;
}

function isTrace(trace: unknown): boolean {
  return Array.isArray(trace) && trace.every((e: any) => e && Number.isInteger(e.line) && Array.isArray(e.callStack)
    && Array.isArray(e.changed) && e.variables && typeof e.variables === 'object');
}

// The UI keeps its own result model; only this adapter knows the shape of the run resource.
export function toExecuteResponse(run: Run): ExecuteResponse {
  const failedToRun = run.status !== 'succeeded' && run.status !== 'compile_error';
  return {
    success: run.status === 'succeeded',
    trace: run.trace,
    stdout: run.stdout,
    stderr: run.stderr,
    compilationError: run.status === 'compile_error' ? run.error ?? 'Biên dịch thất bại.' : undefined,
    runtimeError: failedToRun ? run.error ?? 'Chương trình dừng bất thường.' : undefined,
    stepCount: run.stepCount,
    executionTimeMs: run.durationMs,
    timeLimitExceeded: run.status === 'time_limit_exceeded',
    stepLimitExceeded: run.status === 'step_limit_exceeded',
    executionMode: run.mode,
    sandboxWarning: run.warnings?.sandbox,
    visualizationWarning: run.warnings?.visualization,
  };
}

export async function executeCode(code: string, stdin: string, mode: 'run' | 'visualize' = 'visualize', standard: 'gnu++17' | 'gnu++20' = 'gnu++17'): Promise<ExecuteResponse> {
  assertApiConfigured();

  const post = () => fetch(`${API_BASE}/v1/runs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ code, stdin, language: 'cpp', mode, standard }),
    // Covers compiling and GDB stepping on a small CPU share.
    signal: AbortSignal.timeout(90000)
  });
  let res: Response;
  try {
    res = await post();
    // The backend fell asleep since the page loaded: wait for it to wake, then send the run again.
    if (isWaking(res)) { await healthCheck(); res = await post(); }
  } catch (err: any) {
    if (err.name === 'TimeoutError') throw new Error('Hết thời gian chờ kết nối đến backend.');
    if (err instanceof ApiUnavailable) throw err;
    try { await healthCheck(); res = await post(); }
    catch (retryErr: any) {
      if (retryErr instanceof ApiUnavailable) throw retryErr;
      if (retryErr.name === 'TimeoutError') throw new Error('Hết thời gian chờ kết nối đến backend.');
      throw new Error('Không kết nối được đến backend. Vui lòng kiểm tra lại mạng hoặc URL.');
    }
  }

  if (res.status !== 201) throw new Error(await problemMessage(res));
  if (!isJson(res)) throw new Error('Backend trả về dữ liệu HTML thay vì JSON. Kiểm tra lại cấu hình VITE_API_BASE_URL.');
  const run = await res.json().catch(() => null) as Run | null;
  if (!run || typeof run.id !== 'string' || typeof run.status !== 'string') throw new Error('Phản hồi backend không đúng định dạng run mong đợi.');
  if (!isTrace(run.trace)) throw new Error('Execution trace không hợp lệ hoặc thiếu dữ liệu.');
  return toExecuteResponse({ ...run, stdout: run.stdout || '' });
}

function assertApiConfigured(): void {
  if (!API_BASE) throw new Error('Chưa cấu hình backend. Đặt Repository variable VITE_API_BASE_URL thành URL HTTPS của backend có đuôi /api, rồi chạy lại Deploy to GitHub Pages.');
  let url: URL;
  try { url = new URL(API_BASE); }
  catch { throw new Error('VITE_API_BASE_URL phải là URL đầy đủ, ví dụ https://backend.example/api.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash || url.username || url.password)
    throw new Error('URL backend phải dùng HTTP/HTTPS, không chứa thông tin đăng nhập, query hoặc fragment.');
  if (url.hostname.endsWith('.github.io'))
    throw new Error('GitHub Pages chỉ phục vụ trang tĩnh. Hãy đặt URL của backend riêng vào VITE_API_BASE_URL.');
  if (window.location.protocol === 'https:' && url.protocol !== 'https:')
    throw new Error('Trang HTTPS cần backend HTTPS để tránh bị trình duyệt chặn kết nối.');
}

// Raised when the backend answered but cannot serve runs; retrying will not help.
class ApiUnavailable extends Error { name = 'ApiUnavailable'; }

// A sleeping Render free service answers with its own non-JSON page (without CORS headers, so
// fetch rejects) or a gateway error until the container is up. Only the backend speaks JSON.
const isWaking = (res: Response) => !isJson(res) && (res.ok || res.status >= 502);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Waking a free-tier backend takes about a minute, sometimes more, so keep asking until the deadline.
export async function healthCheck({ deadlineMs = 180000, retryDelayMs = 5000 } = {}): Promise<void> {
  assertApiConfigured();
  const deadline = Date.now() + deadlineMs;
  for (;;) {
    let res: Response | undefined;
    try {
      res = await fetch(`${API_BASE}/v1/health`, { signal: AbortSignal.timeout(Math.max(1, Math.min(30000, deadline - Date.now()))), cache: 'no-store' });
    } catch { /* Not reachable yet. */ }
    if (res && !isWaking(res)) {
      if (!res.ok) throw new ApiUnavailable(await problemMessage(res));
      const data = await res.json().catch(() => null);
      if (data?.status !== 'ok') throw new ApiUnavailable('API health trả JSON không hợp lệ.');
      return;
    }
    if (Date.now() + retryDelayMs >= deadline)
      throw new Error(`Backend chưa phản hồi sau ${Math.round(deadlineMs / 1000)} giây. Máy chủ có thể đang khởi động lại; hãy thử kết nối lại sau ít phút. Nếu vẫn lỗi, kiểm tra URL và CORS_ORIGINS (cần chứa ${window.location.origin}).`);
    await sleep(retryDelayMs);
  }
}
