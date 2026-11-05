import test from 'node:test';
import assert from 'node:assert/strict';
import { takeBuild, type Jailed } from './src/runner/sandboxRunner.js';

const jailed = (stdout: string, extra: Partial<Jailed> = {}): Jailed => ({ code: 0, stdout, stderr: '', killed: false, overflow: false, ...extra });
const block = (binary: string) => { const b64 = Buffer.from(binary).toString('base64'); return `CODELENS-BUILD ${b64.length}\n${b64}\n`; };

test('the binary run.sh emits before the program is stored and removed from the output', async () => {
  const stored: Buffer[] = [];
  const result = takeBuild(jailed(`${block('\x7fELF binary')}{"codelensDebugger":1}`), 1024, async b => { stored.push(b); });
  assert.equal(result.stdout, '{"codelensDebugger":1}');
  assert.equal(stored[0].toString(), '\x7fELF binary');
  assert.equal(result.overflow, false);
});

test('output without a block (compile errors, other runners) is left untouched', () => {
  const compileError = jailed('{"compilationError":"x"}', { code: 65 });
  assert.equal(takeBuild(compileError, 1024, async () => { throw new Error('nothing to store'); }), compileError);
});

test('the output limit applies to the program output only, as without the cache', () => {
  const result = takeBuild(jailed(`${block('bin')}${'y'.repeat(50)}`, { stderr: 'e'.repeat(10) }), 40, async () => {});
  assert.equal(result.overflow, true);
  assert.equal(result.stdout, 'y'.repeat(30));
});

test('a block cut short means the program never ran, and nothing is stored', () => {
  let stored = false;
  const result = takeBuild(jailed('CODELENS-BUILD 100\nabc', { killed: true }), 1024, async () => { stored = true; });
  assert.equal(result.stdout, '');
  assert.equal(stored, false);
});
