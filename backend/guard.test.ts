import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import executeRouter from './src/routes/execute.js';
import { BusyError, createGate, rateLimit } from './src/guard.js';

async function serve(app: express.Express) {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  const close = async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); };
  return { url: `http://127.0.0.1:${port}`, close };
}

test('LocalRunner refuses proxied requests but still serves direct local development', async () => {
  const saved = process.env.RUNNER, savedNode = process.env.NODE_ENV;
  process.env.RUNNER = 'local'; process.env.NODE_ENV = 'test';
  const app = express(); app.use(express.json()); app.use('/api/execute', executeRouter);
  const { url, close } = await serve(app);
  // Mode "run" stops at the Docker check without compiling, so it proves the guard let the request through.
  const body = JSON.stringify({ code: 'int main(){}', stdin: '', language: 'cpp', mode: 'run' });
  const post = (headers: Record<string, string> = {}) =>
    fetch(`${url}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
  try {
    for (const header of [{ 'cf-connecting-ip': '203.0.113.7' }, { 'x-forwarded-for': '203.0.113.7' }, { forwarded: 'for=203.0.113.7' }]) {
      const res = await post(header);
      assert.equal(res.status, 503, JSON.stringify(header));
      assert.match((await res.json()).error, /RUNNER=docker/);
    }
    const direct = await post();
    assert.equal(direct.status, 400);
    assert.match((await direct.json()).runtimeError, /Docker/);
  } finally {
    await close();
    if (saved === undefined) delete process.env.RUNNER; else process.env.RUNNER = saved;
    if (savedNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = savedNode;
  }
});

test('rate limit keys on the visitor address behind a tunnel and resets after the window', async () => {
  let now = 1_000;
  const app = express(); app.use(rateLimit(2, 60_000, () => now)); app.get('/', (_req, res) => { res.json({ ok: true }); });
  const { url, close } = await serve(app);
  const get = (ip: string) => fetch(url, { headers: { 'cf-connecting-ip': ip } });
  try {
    assert.equal((await get('198.51.100.1')).status, 200);
    assert.equal((await get('198.51.100.1')).status, 200);
    const limited = await get('198.51.100.1');
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('retry-after'), '60');
    assert.match((await limited.json()).error, /60 giây/);
    assert.equal((await get('198.51.100.2')).status, 200, 'another visitor has its own budget');
    now += 60_000;
    assert.equal((await get('198.51.100.1')).status, 200);
  } finally { await close(); }
});

test('gate bounds concurrent jobs, rejects past the queue and hands slots over in order', async () => {
  const run = createGate(1, 1);
  const order: string[] = [];
  let finishFirst!: () => void;
  const first = run(() => new Promise<void>(resolve => { finishFirst = () => { order.push('first'); resolve(); }; }));
  const second = run(async () => { order.push('second'); });
  await assert.rejects(run(async () => {}), BusyError);
  assert.deepEqual(order, [], 'queued job waits for the running one');
  finishFirst();
  await Promise.all([first, second]);
  assert.deepEqual(order, ['first', 'second']);
  await run(async () => { order.push('third'); });
  await assert.rejects(run(() => Promise.reject(new Error('boom'))), /boom/);
  await run(async () => { order.push('after failure'); });
  assert.deepEqual(order, ['first', 'second', 'third', 'after failure'], 'a failed job still releases its slot');
});
