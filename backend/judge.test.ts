import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { normalizeOutput } from './src/routes/judge.js';

// Runs through LocalRunner from loopback, so it needs g++ but not Docker.
process.env.RUNNER = 'local';
process.env.JUDGE_TIMEOUT_MS = '1500';
process.env.RATE_LIMIT_PER_MIN = '6';
const { createApp } = await import('./src/app.js');
const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
test.after(() => { server.closeAllConnections(); server.close(); });

const judge = (body: unknown, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  fetch(`${base}/api/v1/judge`, { method: 'POST', headers, body: JSON.stringify(body) });

const doubler = '#include <iostream>\nint main(){ long long x; if(!(std::cin >> x)) return 3; std::cout << x * 2 << "  \\n\\n"; }\n';

test('normalizeOutput ignores trailing spaces and blank lines only', () => {
  assert.equal(normalizeOutput('1 2 \r\n3\n\n'), '1 2\n3');
  assert.notEqual(normalizeOutput('1 2'), normalizeOutput('1  2'));
});

test('one request grades every test case and only costs one rate-limit hit', async () => {
  const res = await judge({
    language: 'cpp', code: doubler,
    tests: [
      { stdin: '21\n', expected: '42' },
      { stdin: '5', expected: '11' },
      { stdin: '', expected: '0' },
      { stdin: '7' },
      { stdin: '-4', expected: '-8\n' },
    ],
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'completed');
  assert.equal(body.error, null);
  assert.deepEqual(body.tests.map((t: { verdict: string }) => t.verdict),
    ['accepted', 'wrong_answer', 'runtime_error', 'finished', 'accepted']);
  assert.equal(body.tests[3].stdout.trim(), '14');
  assert.equal(typeof body.durationMs, 'number');
});

test('compile errors stop grading and are reported once', async () => {
  const res = await judge({ language: 'cpp', code: 'int main(){ return 0 }', tests: [{ stdin: '', expected: '' }, { stdin: '', expected: '' }] });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'compile_error');
  assert.match(body.error, /Compilation failed/);
  assert.deepEqual(body.tests, []);
});

test('a looping submission gets time_limit_exceeded per test', async () => {
  const res = await judge({ language: 'cpp', code: 'int main(){ volatile int x = 0; for(;;) x++; }', tests: [{ stdin: '', expected: '1' }] });
  const body = await res.json();
  assert.deepEqual(body.tests.map((t: { verdict: string }) => t.verdict), ['time_limit_exceeded']);
});

test('invalid bodies get problem details; the shared limiter answers 429 with Retry-After', async () => {
  const bad = await judge({ language: 'cpp', code: doubler, tests: [] });
  assert.equal(bad.status, 422);
  assert.equal((await bad.json()).code, 'invalid_judge');
  const tooLong = await judge({ language: 'cpp', code: doubler, tests: [{ stdin: 'x'.repeat(10_001) }] });
  assert.equal(tooLong.status, 422);
  const media = await fetch(`${base}/api/v1/judge`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
  assert.equal(media.status, 415);
  // Six requests so far (three valid judgings, three rejected bodies) used the budget of 6 per minute.
  const limited = await judge({ language: 'cpp', code: doubler, tests: [{ stdin: '1', expected: '2' }] });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  const get = await fetch(`${base}/api/v1/judge`);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
});
