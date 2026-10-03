import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tokenize } from './src/engine/lexer.js';
import { parse } from './src/engine/parser.js';
import { instrument } from './src/engine/instrumenter.js';
import { LocalRunner } from './src/runner/local.js';

const runner = new LocalRunner();
async function check(source: string, expected: string, name: string, value: unknown) {
  const code = '#include <bits/stdc++.h>\nusing namespace std;\n' + source;
  const original = await runner.run(code, '', { captureTrace: false });
  const result = await runner.run(instrument(parse(tokenize(code)), code), '');
  assert.equal(original.exitCode, 0, original.stderr);
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, original.stdout, 'instrumentation must preserve stdout');
  assert.equal(result.stdout, expected);
  assert.ok(result.trace.length > 0, 'must produce real trace events');
  assert.deepEqual(result.trace.at(-1)?.variables[name], value);
}

test('typedef long long and multi-word return types/parameters', async () => {
  await check('typedef long long ll; long long twice(unsigned long long n) { return n * 2; } int main() { ll x = twice(3000000000ULL); cout << x; return 0; }', '6000000000', 'x', 6000000000);
});
test('using alias chains and global declarations', async () => {
  await check('using ll = long long; using Count = ll; const Count LIMIT = 4000000000LL; Count total; int main() { total = LIMIT; Count x = Count(total); cout << x; return 0; }', '4000000000', 'x', 4000000000);
});
test('long long int and reversed signedness specifiers', async () => {
  await check('long long int twice(long unsigned int n) { return n * 2; } int main() { long long int x = twice(21); cout << x; return 0; }', '42', 'x', 42);
});
test('local aliases restore their outer scope', async () => {
  await check('using T = long long; int main() { { using T = double; T d = 1.5; cout << d; } T x = 4000000000LL; cout << x; return 0; }', '1.54000000000', 'x', 4000000000);
});
test('integer literals retain suffixes and precision', async () => {
  await check('int main() { unsigned long long x = 18446744073709551615ULL; cout << x; return 0; }', '18446744073709551615', 'x', '18446744073709551615');
});
test('hexadecimal, binary, exponent and digit separators', async () => {
  await check("int main() { long long x = 0xFFLL + 0b10 + 1'000; double y = 1e3; cout << x; return 0; }", '1257', 'x', 1257);
});
test('nested templates and aliases produce array snapshots', async () => {
  await check('using Matrix = vector<vector<long long>>; int main() { Matrix x(2); cout << x.size(); return 0; }', '2', 'x', [[], []]);
});
test('auto pair serializes its actual type', async () => {
  await check('int main() { auto x = make_pair(3, 4); cout << 7; return 0; }', '7', 'x', { first: 3, second: 4 });
});
test('uninitialized long long is not narrowed/read while taking snapshot', async () => {
  const code = 'int main() { long long x; x = 4000000000LL; return 0; }';
  const result = await runner.run(instrument(parse(tokenize(code)), code), '');
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.trace.find(e => e.event === 'vardecl')?.variables.x, null);
  assert.equal(result.trace.at(-1)?.variables.x, 4000000000);
});
test('unsupported pointer aliases fail explicitly rather than dropping syntax', () => {
  assert.throws(() => parse(tokenize('typedef long long * Ptr; int main() { return 0; }')), /Mong đợi tên biến/);
});
