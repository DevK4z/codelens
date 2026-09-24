import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBackend } from './check-backend.mjs';
const origin = 'https://devk4z.github.io';
const mock = (cors = origin, status = 200, allowed = 'POST') => async (_url, options) =>
  options.method === 'OPTIONS' ? new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': cors, 'Access-Control-Allow-Methods': allowed,
    'Access-Control-Allow-Headers': 'Content-Type' } }) :
  new Response(JSON.stringify({status: 'ok'}), { status, headers: {
    'Content-Type': 'application/json', 'Access-Control-Allow-Origin': cors } });
test('reject missing/static/insecure/wrong-path backend before making a request', async () => {
  for (const value of ['', 'https://devk4z.github.io/codelens/api', 'http://backend.example/api', 'https://backend.example', 'https://localhost/api'])
    await assert.rejects(checkBackend(value, () => { assert.fail('must not fetch'); }));
});
test('accept healthy backend with POST preflight and trailing whitespace/slash', async () => {
  await checkBackend(' https://backend.example/api/ ', mock());
});
test('reject wrong CORS origin, failed health, and missing POST preflight', async () => {
  await assert.rejects(checkBackend('https://backend.example/api', mock('http://localhost:5173')), /CORS/);
  await assert.rejects(checkBackend('https://backend.example/api', mock(origin, 503)), /503/);
  await assert.rejects(checkBackend('https://backend.example/api', mock(origin, 200, 'GET')), /preflight/);
});
test('reject static HTML health responses', async () => {
  await assert.rejects(checkBackend('https://backend.example/api', async () => new Response('<html/>')), /JSON/);
});
