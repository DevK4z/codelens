import test from 'node:test';
import assert from 'node:assert/strict';

(globalThis as any).window = { location: { hostname: 'localhost', protocol: 'http:', origin: 'http://localhost:5173' } };
const { executeCode, healthCheck, toExecuteResponse } = await import('./src/engine/api.ts');

const step = { step: 0, line: 3, event: 'line', callStack: [{ func: 'main', line: 3 }], variables: { x: 6 }, changed: ['x'] };
const run = {
  id: 'b7e1c2a4-0000-4000-8000-000000000001', status: 'succeeded', language: 'cpp', mode: 'visualize', standard: 'gnu++17',
  createdAt: '2026-11-01T00:00:00.000Z', durationMs: 12, stdout: '42', stderr: '', error: null, stepCount: 1, trace: [step],
  warnings: { visualization: 'GCC/GDB' },
} as const;

function respond(status: number, body: unknown, type = 'application/json') {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': type } });
  }) as typeof fetch;
  return calls;
}

test('a run is created with POST /v1/runs and mapped to the UI result', async () => {
  const calls = respond(201, run);
  const result = await executeCode('int main(){}', '', 'visualize', 'gnu++17');
  assert.equal(calls[0].url, 'http://localhost:3001/api/v1/runs');
  assert.equal(calls[0].init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { code: 'int main(){}', stdin: '', language: 'cpp', mode: 'visualize', standard: 'gnu++17' });
  assert.equal(result.success, true);
  assert.equal(result.stdout, '42');
  assert.equal(result.executionTimeMs, 12);
  assert.equal(result.visualizationWarning, 'GCC/GDB');
  assert.deepEqual(result.trace, [step]);
});

test('run outcomes map to the compile and runtime error fields the UI shows', () => {
  const compile = toExecuteResponse({ ...run, status: 'compile_error', error: 'expected ;', trace: [], stepCount: 0 });
  assert.equal(compile.success, false);
  assert.equal(compile.compilationError, 'expected ;');
  assert.equal(compile.runtimeError, undefined);

  const tle = toExecuteResponse({ ...run, status: 'time_limit_exceeded', error: 'Chương trình vượt giới hạn thời gian.' });
  assert.equal(tle.timeLimitExceeded, true);
  assert.equal(tle.runtimeError, 'Chương trình vượt giới hạn thời gian.');
  assert.deepEqual(tle.trace, [step], 'partial trace is kept for loops that hit a limit');
});

test('problem details are surfaced as the error message', async () => {
  respond(429, { type: 'about:blank', title: 'Too Many Requests', status: 429, code: 'rate_limited', detail: 'Thử lại sau 42 giây.' }, 'application/problem+json');
  await assert.rejects(executeCode('x', ''), /Thử lại sau 42 giây\./);
  respond(422, { status: 422, code: 'invalid_run', detail: 'standard phải là "gnu++17" hoặc "gnu++20".' }, 'application/problem+json');
  await assert.rejects(executeCode('x', ''), /standard phải là/);
  respond(404, '<html>Not Found</html>', 'text/html');
  await assert.rejects(executeCode('x', ''), /404/);
});

test('malformed run payloads are rejected instead of reaching the player', async () => {
  respond(201, { ...run, trace: [{ line: 'x' }] });
  await assert.rejects(executeCode('x', ''), /trace không hợp lệ/);
  respond(201, { ok: true });
  await assert.rejects(executeCode('x', ''), /định dạng run/);
});

test('health uses GET /v1/health and reports problem details', async () => {
  const calls = respond(200, { status: 'ok', runner: 'docker' });
  await healthCheck();
  assert.equal(calls[0].url, 'http://localhost:3001/api/v1/health');
  respond(503, { status: 503, code: 'runner_unavailable', detail: 'Docker chưa sẵn sàng.' }, 'application/problem+json');
  await assert.rejects(healthCheck(), /Docker chưa sẵn sàng\./);
});
