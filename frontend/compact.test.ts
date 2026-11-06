import test from 'node:test';
import assert from 'node:assert/strict';
import { compactTrace, hideUninitialized } from './src/engine/compact.ts';
import type { TraceEvent } from './src/engine/types.ts';

const frame = (func: string, line: number) => ({ func, line });
const at = (line: number, stack: string[]): TraceEvent => ({ step: 0, line, event: 'line', callStack: stack.map(f => frame(f, line)), variables: {}, changed: [], detail: 'GCC/GDB: before' });

const code = `int add(const int &a, int b) {
  return a + b;
}
int f(int n) {
  if (n == 0) {
    return 0;
  }
  return f(n - 1);
}
int main() {
  int x = add(1, 2);
  f(1);
  return 0;
}
`;

test('function headers on entry and closing braces on exit are dropped', () => {
  const trace = [at(10, ['main']), at(11, ['main']), at(1, ['main', 'add']), at(2, ['main', 'add']), at(3, ['main', 'add']), at(12, ['main']), at(13, ['main']), at(14, ['main'])];
  const out = compactTrace(trace, code);
  assert.deepEqual(out.map(e => e.line), [11, 2, 12, 13, 14], 'the last step always stays');
  assert.deepEqual(out.map(e => e.step), [0, 1, 2, 3, 4]);
});

test('a recursive call keeps its closing brace, where it hands back its result', () => {
  const trace = [at(5, ['main', 'f']), at(9, ['main', 'f']), at(12, ['main']), at(13, ['main'])];
  assert.deepEqual(compactTrace(trace, code).map(e => e.line), [5, 9, 12, 13]);
});

test('a header line reached without entering a call, and other events, stay', () => {
  const again = [at(11, ['main']), at(10, ['main']), at(12, ['main'])];
  assert.equal(compactTrace(again, code).length, 3);
  const demo = { ...at(3, ['main', 'add']), detail: undefined, event: 'return' } as TraceEvent;
  assert.equal(compactTrace([demo, at(12, ['main'])], code).length, 2);
});

const step = (line: number, variables: Record<string, unknown>) => ({ ...at(line, ['main']), variables });

test('an array declared without a value shows unknown cells until each is written', () => {
  const code = 'int main() {\n  int n = 3;\n  long long f[n + 1];\n  f[0] = 0;\n  f[1] = 1;\n  return 0;\n}';
  const out = hideUninitialized([
    step(4, { n: 3, f: [0, 836436063, 32765, 1] }),
    step(5, { n: 3, f: [0, 836436063, 32765, 1] }),
    step(6, { n: 3, f: [0, 1, 32765, 1] }),
  ], code);
  assert.deepEqual(out[0].variables.f, [null, null, null, null]);
  assert.deepEqual(out[1].variables.f, [0, null, null, null], 'writing the value already in memory still counts');
  assert.deepEqual(out[2].variables.f, [0, 1, null, null]);
});

test('scalars count as written by assignment, input or being passed by address', () => {
  const code = 'int main() {\n  int x, y;\n  int z = 5;\n  x = 0;\n  cin >> y;\n  return 0;\n}';
  const out = hideUninitialized([step(3, { x: 0, y: 7, z: null }), step(4, { x: 0, y: 7, z: 5 }), step(5, { x: 0, y: 7, z: 5 }), step(6, { x: 0, y: 7, z: 5 })], code);
  assert.deepEqual(out[0].variables, { x: null, y: null, z: null });
  assert.deepEqual(out[2].variables, { x: 0, y: null, z: 5 });
  assert.deepEqual(out[3].variables, { x: 0, y: 7, z: 5 });
});

test('initialised variables, parameters and globals are left alone', () => {
  const code = 'int g[3];\nint f(int a) {\n  int b = 1;\n  int c[2] = {0};\n  return a;\n}';
  const trace = [{ ...at(5, ['f']), variables: { a: 9, b: 1, c: [0, 0], g: [0, 0, 0] } }];
  assert.equal(hideUninitialized(trace, code), trace);
});

test('memset writes the whole array', () => {
  const code = 'int main() {\n  int a[2];\n  memset(a, 0, sizeof a);\n  return 0;\n}';
  const out = hideUninitialized([step(3, { a: [0, 0] }), step(4, { a: [0, 0] })], code);
  assert.deepEqual(out[1].variables.a, [0, 0]);
});

test('a closing brace that does not end a recursive call is dropped too', () => {
  assert.deepEqual(compactTrace([at(3, ['main']), at(11, ['main']), at(12, ['main'])], code).map(e => e.line), [11, 12]);
});
