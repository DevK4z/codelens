import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBackend, validateBase } from './check-backend.mjs';

const base = 'https://api.example.com/api';
const origin = 'https://devk4z.github.io';
const health = (headers = {}, status = 200, body = '{"status":"ok"}') => new Response(body, {
  status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin, ...headers }
});
const options = (headers = {}) => new Response(null, { status: 204, headers: {
  'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST',
  'access-control-allow-headers': 'Content-Type', ...headers
}});

test('reject missing/unsafe production URLs before making requests', async () => {
  for (const value of ['', 'abc', 'http://api.example.com/api', 'https://localhost/api',
    'https://127.0.0.1/api', 'https://devk4z.github.io/codelens/api',
    'https://user:pass@api.example.com/api', `${base}?x=1`, `${base}#x`, 'https://api.example.com']) {
    await assert.rejects(checkBackend(value, () => assert.fail('must not fetch')));
  }
  assert.equal(validateBase(` ${base}/ `), base);
});

test('health and preflight use Pages origin and do not execute code', async () => {
  const calls = [];
  await checkBackend(base, async (url, init) => {
    calls.push([url, init]);
    return calls.length === 1 ? health() : options();
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], `${base}/health`);
  assert.equal(calls[0][1].headers.Origin, origin);
  assert.equal(calls[1][0], `${base}/execute`);
  assert.equal(calls[1][1].method, 'OPTIONS');
  assert.equal(calls[1][1].headers['Access-Control-Request-Method'], 'POST');
});

test('reject unhealthy, HTML and malformed responses', async () => {
  for (const response of [health({}, 503, '{"status":"unavailable"}'),
    health({}, 200, '{"status":"unavailable"}'), health({}, 200, 'oops'),
    health({'content-type': 'text/html'}, 200, '<html/>')]) {
    await assert.rejects(checkBackend(base, async () => response));
  }
});

test('reject missing origin and incomplete preflight permissions', async () => {
  await assert.rejects(checkBackend(base, async () => health({'access-control-allow-origin': 'http://localhost:5173'})), /CORS/);
  for (const response of [options({'access-control-allow-origin': ''}),
    options({'access-control-allow-methods': 'GET'}), options({'access-control-allow-headers': ''}),
    new Response(null, {status: 405})]) {
    let call = 0;
    await assert.rejects(checkBackend(base, async () => ++call === 1 ? health() : response));
  }
});

test('network failure is surfaced', async () => {
  await assert.rejects(checkBackend(base, async () => { throw new Error('network unavailable'); }), /network unavailable/);
});
