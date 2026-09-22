import assert from 'node:assert/strict';
import { tokenize } from './src/engine/lexer';
import { parse } from './src/engine/parser';
import { instrument } from './src/engine/instrumenter';
import { runCode } from './src/runner/local';
import { SAMPLES } from '../frontend/src/data/samples';
import { getFallbackDemoTrace } from '../frontend/src/data/demoTraces';
import { generateExplanation } from '../frontend/src/engine/explanations';

async function run(code: string, input = '') {
  const result = await runCode(instrument(parse(tokenize(code)), code), input);
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stderr, '', 'Trace must be valid JSON');
  assert.ok(result.trace.length);
  return result;
}
const sample = (id: string) => SAMPLES.find(s => s.id === id)!;
const binary = sample('binary-search');
for (const [target, expected, mids] of [[7, 3, [3]], [11, 5, [3, 5]], [8, -1, [3, 5, 4]]] as const) {
  const result = await run(binary.code, `7\n1 3 5 7 9 11 13\n${target}`);
  assert.equal(result.stdout.trim(), String(expected));
  assert.deepEqual(result.trace.filter(e => e.event === 'vardecl' && e.changed.includes('mid')).map(e => e.variables.mid), [...mids]);
}
const fact = sample('factorial');
const factorial = await run(fact.code, '4');
assert.equal(factorial.stdout.trim(), '24');
const returns = factorial.trace.filter(e => e.event === 'return' && e.callStack.at(-1)?.func === 'factorial');
assert.deepEqual(returns.map(e => (e.callStack.at(-1) as any).returnValue), [1, 2, 6, 24]);
assert.deepEqual(returns.map(e => e.callStack.length), [5, 4, 3, 2]);
assert.equal(factorial.trace.find(e => e.event === 'stdout')!.callStack.length, 1);
assert.equal(getFallbackDemoTrace(fact.code, '4'), null);
assert.equal(getFallbackDemoTrace(fact.code + '\n', fact.stdin), null);
for (const s of SAMPLES.filter(s => s.id !== 'blank')) {
  const fresh = await run(s.code, s.stdin);
  assert.deepEqual(getFallbackDemoTrace(s.code, s.stdin)?.trace, fresh.trace, `Stale demo: ${s.id}`);
}
const effects = await run('int main() { int i = 0; while (i++ < 2) { cout << i; } cout << i++; return 0; }');
assert.equal(effects.stdout, '123', 'Conditions and cout must evaluate side effects only once');
const uninit = await run('int main() { int x; x = 2; cout << x; return 0; }');
assert.equal(uninit.trace.find(e => e.event === 'vardecl')!.variables.x, null);
assert.match(generateExplanation(uninit.trace.find(e => e.event === 'vardecl')!), /chưa khởi tạo/);
console.log('PASS: binary search paths, recursive unwind, immutable demos, side effects, uninitialized variables, explanations');
