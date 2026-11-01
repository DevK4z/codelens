import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://devk4z.github.io';

export function validateBase(value) {
  const base = (value || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('Thiếu Repository variable VITE_API_BASE_URL. Đặt URL HTTPS của backend thật có đuôi /api rồi chạy lại workflow.');
  let url;
  try { url = new URL(base); } catch { throw new Error('VITE_API_BASE_URL phải là URL đầy đủ.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    throw new Error('Backend production phải dùng HTTPS, không chứa credentials, query hoặc fragment.');
  if (url.hostname === 'localhost' || url.hostname === '[::1]' || /^127\./.test(url.hostname) || url.hostname.endsWith('.github.io'))
    throw new Error('Backend phải là máy chủ riêng, không phải localhost hoặc GitHub Pages.');
  if (!url.pathname.endsWith('/api')) throw new Error('VITE_API_BASE_URL phải kết thúc bằng /api.');
  return base;
}

function checkOrigin(response) {
  const allowed = response.headers.get('access-control-allow-origin');
  if (allowed !== ORIGIN && allowed !== '*')
    throw new Error(`CORS chưa cho phép ${ORIGIN}. Kiểm tra CORS_ORIGINS trên backend (không thêm /codelens/).`);
}

// A sleeping host (Render free instances stop after 15 idle minutes) answers slowly or with 5xx
// while it starts, so the health request is retried; anything else fails on the first answer.
async function fetchHealth(base, request, { attempts, delayMs }) {
  for (let attempt = 1; ; attempt++) {
    try {
      const health = await request(`${base}/v1/health`, {
        headers: { Origin: ORIGIN }, signal: AbortSignal.timeout(60000), redirect: 'error'
      });
      if (health.status < 500 || attempt >= attempts) return health;
    } catch (error) {
      if (attempt >= attempts) throw error;
    }
    console.log(`Backend chưa sẵn sàng, thử lại sau ${delayMs / 1000}s (${attempt}/${attempts})...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

export async function checkBackend(value, request = fetch, retry = { attempts: 1, delayMs: 0 }) {
  const base = validateBase(value);
  const health = await fetchHealth(base, request, retry);
  // Failures arrive as application/problem+json, successes as application/json.
  if (!/[/+]json\b/.test(health.headers.get('content-type') || ''))
    throw new Error(`Health trả HTTP ${health.status}, không phải JSON. Kiểm tra URL API/reverse proxy.`);
  const data = await health.json();
  if (!health.ok || data?.status !== 'ok')
    throw new Error(`Backend/runner chưa sẵn sàng (HTTP ${health.status}). ${data?.detail || 'Kiểm tra log backend và Docker.'}`);
  checkOrigin(health);
  const preflight = await request(`${base}/v1/runs`, {
    method: 'OPTIONS',
    headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    signal: AbortSignal.timeout(15000), redirect: 'error'
  });
  if (!preflight.ok) throw new Error(`Preflight OPTIONS thất bại (HTTP ${preflight.status}).`);
  checkOrigin(preflight);
  const methods = (preflight.headers.get('access-control-allow-methods') || '').toUpperCase().split(',').map(s => s.trim());
  const headers = (preflight.headers.get('access-control-allow-headers') || '').toLowerCase().split(',').map(s => s.trim());
  if (!methods.includes('POST') && !methods.includes('*')) throw new Error('CORS preflight chưa cho phép POST.');
  if (!headers.includes('content-type') && !headers.includes('*')) throw new Error('CORS preflight chưa cho phép Content-Type.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await checkBackend(process.env.VITE_API_BASE_URL, fetch, { attempts: 12, delayMs: 15000 });
    console.log('Backend health và CORS/preflight hợp lệ.');
  } catch (error) {
    console.error(`Kiểm tra backend thất bại: ${error.message}`);
    process.exitCode = 1;
  }
}
