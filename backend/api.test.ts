import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from './src/app.js';

// Runs through LocalRunner from loopback, so it needs g++ but not Docker.
process.env.RUNNER = 'local';
const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
test.after(() => { server.closeAllConnections(); server.close(); });

const json = { 'Content-Type': 'application/json' };
const submit = (body: unknown, headers: Record<string, string> = json) =>
  fetch(`${base}/api/v1/runs`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
const valid = { language: 'cpp', mode: 'visualize', code: '#include <iostream>\nusing namespace std;\nint main(){\n  int x = 6;\n  cout << x * 7;\n  return 0;\n}\n' };

async function problem(res: Response, status: number, code: string) {
  assert.equal(res.status, status);
  assert.match(res.headers.get('content-type') ?? '', /^application\/problem\+json/);
  const body = await res.json();
  assert.equal(body.status, status);
  assert.equal(body.code, code);
  assert.equal(typeof body.title, 'string');
  assert.equal(typeof body.detail, 'string');
  return body;
}

test('POST /runs creates a run resource that GET /runs/{id} returns again', async () => {
  const created = await submit(valid);
  assert.equal(created.status, 201);
  const run = await created.json();
  assert.equal(created.headers.get('location'), `/api/v1/runs/${run.id}`);
  assert.equal(run.status, 'succeeded');
  assert.equal(run.stdout, '42');
  assert.equal(run.error, null);
  assert.equal(run.mode, 'visualize');
  assert.equal(run.stepCount, run.trace.length);
  assert.ok(run.trace.length > 0);
  assert.ok(!Number.isNaN(Date.parse(run.createdAt)));
  assert.equal(run.code, undefined, 'source code is not echoed or stored');

  const fetched = await fetch(`${base}${created.headers.get('location')}`);
  assert.equal(fetched.status, 200);
  assert.deepEqual(await fetched.json(), run);
});

test('compiler and program failures are run outcomes, not HTTP errors', async () => {
  const compile = await submit({ ...valid, code: 'int main(){ return 0 }' });
  assert.equal(compile.status, 201);
  const failedCompile = await compile.json();
  assert.equal(failedCompile.status, 'compile_error');
  assert.ok(failedCompile.error);

  const crash = await submit({ ...valid, code: 'int main(){\n  return 3;\n}\n' });
  assert.equal(crash.status, 201);
  assert.equal((await crash.json()).status, 'runtime_error');
});

test('invalid requests get precise status codes with problem details', async () => {
  await problem(await submit({ ...valid, language: 'python' }), 422, 'invalid_run');
  await problem(await submit({ ...valid, standard: 'c++98' }), 422, 'invalid_run');
  await problem(await submit({ ...valid, code: '' }), 422, 'invalid_run');
  await problem(await submit({ ...valid, stdin: 5 }), 422, 'invalid_run');
  await problem(await submit({ ...valid, mode: 'run' }), 422, 'mode_unavailable');
  await problem(await submit('{"language":', json), 400, 'malformed_json');
  await problem(await submit(JSON.stringify(valid), { 'Content-Type': 'text/plain' }), 415, 'unsupported_media_type');
  await problem(await fetch(`${base}/api/v1/runs/00000000-0000-4000-8000-000000000000`), 404, 'run_not_found');
  await problem(await fetch(`${base}/api/v1/nothing-here`), 404, 'not_found');
});

test('unsupported methods answer 405 with Allow', async () => {
  const list = await fetch(`${base}/api/v1/runs`);
  await problem(list, 405, 'method_not_allowed');
  assert.equal(list.headers.get('allow'), 'POST');
  const remove = await fetch(`${base}/api/v1/runs/some-id`, { method: 'DELETE' });
  await problem(remove, 405, 'method_not_allowed');
  assert.equal(remove.headers.get('allow'), 'GET');
  const health = await fetch(`${base}/api/v1/health`, { method: 'POST' });
  assert.equal(health.headers.get('allow'), 'GET');
});

test('health is a cache-free GET resource', async () => {
  const res = await fetch(`${base}/api/v1/health`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await res.json(), { status: 'ok', runner: 'local' });
});

test('CORS lets the Pages frontend read Location and Retry-After', async () => {
  const res = await submit(valid, { ...json, Origin: 'https://devk4z.github.io' });
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://devk4z.github.io');
  const exposed = (res.headers.get('access-control-expose-headers') ?? '').toLowerCase();
  assert.match(exposed, /location/);
  assert.match(exposed, /retry-after/);
});

test('deprecated /api/execute and /api/health keep the old shapes and point to v1', async () => {
  const res = await fetch(`${base}/api/execute`, { method: 'POST', headers: json, body: JSON.stringify(valid) });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('deprecation'), 'true');
  assert.match(res.headers.get('link') ?? '', /<\/api\/v1\/runs>; rel="successor-version"/);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.stdout, '42');
  assert.equal(data.executionMode, 'visualize');
  assert.ok(Array.isArray(data.trace) && data.trace.length > 0);

  const invalid = await fetch(`${base}/api/execute`, { method: 'POST', headers: json, body: JSON.stringify({ ...valid, language: 'go' }) });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).success, false);

  const health = await fetch(`${base}/api/health`);
  assert.equal(health.headers.get('deprecation'), 'true');
  assert.match(health.headers.get('content-type') ?? '', /^application\/json/);
  assert.equal((await health.json()).status, 'ok');
});
