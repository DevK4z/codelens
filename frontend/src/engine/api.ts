import { ExecuteResponse } from './types';

const configured = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = configured || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:3001/api' : '');

export async function executeCode(code: string, stdin: string): Promise<ExecuteResponse> {
  if (!API_BASE) throw new Error('Chưa cấu hình backend. Chọn bài mẫu hoặc cấu hình VITE_API_BASE_URL để chạy code.');
  const res = await fetch(`${API_BASE}/execute`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, stdin, language: 'cpp' }),
    signal: AbortSignal.timeout(30000)
  });
  if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('Backend trả về dữ liệu không phải JSON. Kiểm tra URL API.');
  const data = await res.json();
  if (!res.ok && !data.compilationError && !data.runtimeError) throw new Error(data.error || `Lỗi máy chủ: ${res.status}`);
  if (typeof data.success !== 'boolean') throw new Error('Phản hồi backend không đúng định dạng.');
  if (data.success && !Array.isArray(data.trace)) throw new Error('Backend thiếu execution trace.');
  const trace = data.trace || [];
  if (!Array.isArray(trace) || trace.some((e: any) => !e || !Number.isInteger(e.line) || !Array.isArray(e.callStack) || !Array.isArray(e.changed) || !e.variables || typeof e.variables !== 'object')) throw new Error('Execution trace không hợp lệ.');
  return { ...data, trace, stdout: data.stdout || '' };
}

export async function healthCheck(): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok && res.headers.get('content-type')?.includes('application/json') === true && (await res.json()).status === 'ok';
  } catch { return false; }
}
