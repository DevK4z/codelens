import { ExecuteResponse } from './types';

const configured = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = configured || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:3001/api' : '');

export async function executeCode(code: string, stdin: string): Promise<ExecuteResponse> {
  assertApiConfigured();
  
  let res;
  try {
    res = await fetch(\\/execute\, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, stdin, language: 'cpp' }),
      signal: AbortSignal.timeout(30000)
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError') throw new Error('Hết thời gian chờ kết nối đến backend.');
    throw new Error('Không kết nối được đến backend. Vui lòng kiểm tra lại mạng hoặc URL.');
  }

  if (res.status === 404) throw new Error('Sai đường dẫn API (404 Not Found).');
  if (res.status === 405) throw new Error('Endpoint không chấp nhận phương thức POST (405 Method Not Allowed). Có thể URL đang trỏ tới trang tĩnh.');
  if (res.status === 503) throw new Error('Backend chưa sẵn sàng hoặc runner chưa khả dụng (503 Service Unavailable).');

  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Backend trả về dữ liệu HTML thay vì JSON. Kiểm tra lại cấu hình VITE_API_BASE_URL.');
  }

  const data = await res.json();
  if (!res.ok && !data.compilationError && !data.runtimeError) throw new Error(data.error || \Lỗi máy chủ: \\);
  if (typeof data.success !== 'boolean') throw new Error('Phản hồi backend không đúng định dạng JSON mong đợi.');
  if (data.success && !Array.isArray(data.trace)) throw new Error('Backend thiếu execution trace.');
  
  const trace = data.trace || [];
  if (!Array.isArray(trace) || trace.some((e: any) => !e || !Number.isInteger(e.line) || !Array.isArray(e.callStack) || !Array.isArray(e.changed) || !e.variables || typeof e.variables !== 'object')) {
    throw new Error('Execution trace không hợp lệ hoặc thiếu dữ liệu.');
  }
  return { ...data, trace, stdout: data.stdout || '' };
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

export async function healthCheck(): Promise<void> {
  assertApiConfigured();
  let res: Response;
  try {
    res = await fetch(\\/health\, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError')
      throw new Error('Backend chưa phản hồi sau 15 giây. Nếu máy chủ đang khởi động, hãy thử kết nối lại.');
    throw new Error('Không truy cập được backend. Kiểm tra URL, máy chủ và CORS_ORIGINS (cần chứa ' + window.location.origin + ').');
  }
  if (!res.headers.get('content-type')?.includes('application/json'))
    throw new Error(\API health trả về HTTP \ và không phải JSON. Kiểm tra URL backend và đường dẫn /api.\);
  let data;
  try { data = await res.json(); }
  catch { throw new Error('API health trả JSON không hợp lệ.'); }
  if (!res.ok || data?.status !== 'ok')
    throw new Error(typeof data?.error === 'string' ? data.error : \Backend chưa sẵn sàng (HTTP \).\);
}
