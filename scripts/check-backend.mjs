import { pathToFileURL } from 'node:url';

export async function checkBackend(value, request = fetch) {
  if (!value?.trim()) throw new Error('Set repository variable VITE_API_BASE_URL before deploying Pages.');
  const url = new URL(value.trim().replace(/\/+$/, ''));
  if (url.protocol !== 'https:' || url.hostname.endsWith('.github.io') ||
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/api')) {
    throw new Error('VITE_API_BASE_URL must be a public HTTPS backend URL ending in /api, not GitHub Pages.');
  }
  const origin = 'https://devk4z.github.io';
  const health = await request(`${url.href}/health`, {
    headers: { Origin: origin }, signal: AbortSignal.timeout(20000), redirect: 'error'
  });
  if (!health.ok || !health.headers.get('content-type')?.includes('application/json'))
    throw new Error(`Backend health is unavailable or not JSON (HTTP ${health.status}).`);
  if ((await health.json())?.status !== 'ok') throw new Error('Backend health is not ready.');
  if (![origin, '*'].includes(health.headers.get('access-control-allow-origin')))
    throw new Error(`Set backend CORS_ORIGINS=${origin} (no /codelens path).`);
  const preflight = await request(`${url.href}/execute`, {
    method: 'OPTIONS', signal: AbortSignal.timeout(10000), redirect: 'error',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' }
  });
  if (!preflight.ok || ![origin, '*'].includes(preflight.headers.get('access-control-allow-origin')) ||
      !preflight.headers.get('access-control-allow-methods')?.split(',').map(s => s.trim().toUpperCase()).includes('POST') ||
      !preflight.headers.get('access-control-allow-headers')?.split(',').map(s => s.trim().toLowerCase()).includes('content-type'))
    throw new Error('Backend must allow CORS preflight for POST /api/execute with Content-Type.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await checkBackend(process.env.VITE_API_BASE_URL); console.log('Backend health and CORS checks passed.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
