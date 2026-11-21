import test from 'node:test';
import assert from 'node:assert/strict';

(globalThis as any).window = { location: { hostname: 'localhost', protocol: 'http:', origin: 'http://localhost:5173' } };
const { executeCode, healthCheck, toExecuteResponse, judgeCode, JudgeUnsupported } = await import('./src/engine/api.ts');

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

// Replays a sequence of responses; a thrown error stands for fetch rejecting (no CORS on Render's wake page).
function sequence(...steps: (Error | [number, unknown, string?])[]) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string) => {
    calls.push(url);
    const next = steps.shift();
    if (!next) throw new Error('unexpected request');
    if (next instanceof Error) throw next;
    const [status, body, type = 'application/json'] = next;
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': type } });
  }) as typeof fetch;
  return calls;
}

test('health waits while a sleeping backend wakes up', async () => {
  const calls = sequence(new TypeError('Failed to fetch'), [502, '<html>Bad Gateway</html>', 'text/html'], [200, '<html>Waking up</html>', 'text/html'], [200, { status: 'ok', runner: 'sandbox' }]);
  await healthCheck({ deadlineMs: 1000, retryDelayMs: 1 });
  assert.equal(calls.length, 4);

  sequence(...Array.from({ length: 50 }, () => new TypeError('Failed to fetch')));
  await assert.rejects(healthCheck({ deadlineMs: 50, retryDelayMs: 10 }), /chưa phản hồi/);
});

test('a run sent to a backend that fell asleep is sent again once it wakes', async () => {
  const calls = sequence(new TypeError('Failed to fetch'), [200, { status: 'ok', runner: 'sandbox' }], [201, run]);
  const result = await executeCode('int main(){}', '');
  assert.equal(result.stdout, '42');
  assert.deepEqual(calls.map(url => url.replace('http://localhost:3001/api', '')), ['/v1/runs', '/v1/health', '/v1/runs']);
});

// ---------------- POST /v1/judge ----------------

type Reply = { status: number; body?: unknown; type?: string; headers?: Record<string, string> } | 'network-error';
function script(replies: Reply[]) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string) => {
    calls.push(String(url));
    const next = replies.shift();
    if (!next) throw new Error('unexpected extra request');
    if (next === 'network-error') throw new TypeError('Failed to fetch');
    return new Response(typeof next.body === 'string' ? next.body : JSON.stringify(next.body ?? {}),
      { status: next.status, headers: { 'Content-Type': next.type ?? 'application/json', ...next.headers } });
  }) as typeof fetch;
  return calls;
}
const judged = { status: 'completed', error: null, durationMs: 30, tests: [
  { verdict: 'accepted', durationMs: 10, stdout: '2', stderr: '' },
  { verdict: 'time_limit_exceeded', durationMs: 5000, stdout: '', stderr: '' },
] };
const twoTests = [{ stdin: '1', expected: '2' }, { stdin: '9', expected: '18' }];
const limited = { status: 429, type: 'application/problem+json', headers: { 'Retry-After': '7' },
  body: { status: 429, code: 'rate_limited', detail: 'Bạn gửi quá nhiều yêu cầu. Thử lại sau 7 giây.' } };

test('judgeCode grades all tests with one POST /v1/judge', async () => {
  const calls = script([{ status: 200, body: judged }]);
  const res = await judgeCode('int main(){}', twoTests, { wait: async () => {} });
  assert.deepEqual(calls, ['http://localhost:3001/api/v1/judge']);
  assert.deepEqual(res.tests.map(t => t.verdict), ['accepted', 'time_limit_exceeded']);
});

test('judgeCode waits for Retry-After on 429 and tries again', async () => {
  const waits: number[] = [], notes: string[] = [];
  const calls = script([limited, { status: 503, type: 'application/problem+json', body: { status: 503, code: 'runner_busy', detail: 'bận' } }, { status: 200, body: judged }]);
  const res = await judgeCode('x', twoTests, { wait: async ms => { waits.push(ms); }, onWait: (s, r) => notes.push(`${s}:${r}`) });
  assert.equal(res.status, 'completed');
  assert.equal(calls.length, 3);
  assert.deepEqual(waits, [7000, 10000], 'Retry-After first, then a growing default');
  assert.match(notes[0], /^7:.*giới hạn/);
});

test('judgeCode gives up after maxAttempts with a message that the work is saved', async () => {
  script([limited, limited]);
  await assert.rejects(judgeCode('x', twoTests, { maxAttempts: 2, wait: async () => {} }), /Thử lại sau 7 giây\..*Chấm lại/);
});

test('judgeCode does not retry problems that cannot improve', async () => {
  const calls = script([{ status: 503, type: 'application/problem+json', body: { status: 503, code: 'local_runner_not_public', detail: 'LocalRunner chỉ phục vụ local.' } }]);
  await assert.rejects(judgeCode('x', twoTests, { wait: async () => {} }), /LocalRunner chỉ phục vụ local/);
  assert.equal(calls.length, 1);
  script([{ status: 422, type: 'application/problem+json', body: { status: 422, code: 'invalid_judge', detail: 'tests phải là mảng' } }]);
  await assert.rejects(judgeCode('x', twoTests, { wait: async () => {} }), /tests phải là mảng/);
});

test('an older backend without /v1/judge raises JudgeUnsupported so callers can fall back', async () => {
  script([{ status: 404, type: 'application/problem+json', body: { status: 404, code: 'not_found', detail: 'Không có API' } }]);
  await assert.rejects(judgeCode('x', twoTests), (err: unknown) => err instanceof JudgeUnsupported);
});

test('a sleeping backend is woken through /v1/health before judging again', async () => {
  const calls = script(['network-error', { status: 200, body: { status: 'ok', runner: 'sandbox' } }, { status: 200, body: judged }]);
  const res = await judgeCode('x', twoTests, { wait: async () => {} });
  assert.equal(res.tests.length, 2);
  assert.deepEqual(calls.map(u => u.replace('http://localhost:3001/api', '')), ['/v1/judge', '/v1/health', '/v1/judge']);
});

test('judge responses with the wrong number of results are rejected', async () => {
  script([{ status: 200, body: { ...judged, tests: judged.tests.slice(0, 1) } }]);
  await assert.rejects(judgeCode('x', twoTests), /không đúng định dạng/);
});
