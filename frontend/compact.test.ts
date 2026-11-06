import test from 'node:test';
import assert from 'node:assert/strict';
import { compactTrace } from './src/engine/compact.ts';
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
