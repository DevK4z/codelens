import test from 'node:test';
import assert from 'node:assert/strict';
import { readSavedRun, saveRun, SAVED_RUN_KEY } from './src/utils/savedRun.ts';

const draft = {code: '#include <iostream>\nint main(){ /* Tiếng Việt */ return 0; }', stdin:'2\n4 8\n', mode:'visualize' as const, standard:'gnu++20' as const};
function storage() {
  const entries = new Map<string, string>();
  return {getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => {entries.set(key, value);}};
}
test('a fresh page can restore exact code, stdin, mode and standard after a run', () => {
  const persistent = storage();
  const saved = saveRun(draft, persistent);
  assert.ok(saved);
  assert.deepEqual(readSavedRun(persistent), saved);
  assert.equal(saved.code, draft.code);
  assert.equal(saved.stdin, draft.stdin);
  assert.equal(saved.standard, 'gnu++20');
  assert.equal(saved.mode, 'visualize');
});
test('latest run replaces previous snapshot and empty editor content remains empty', () => {
  const persistent = storage();
  saveRun(draft, persistent);
  saveRun({...draft, code:'', stdin:'', mode:'run'}, persistent);
  assert.equal(readSavedRun(persistent)?.code, '');
  assert.equal(readSavedRun(persistent)?.stdin, '');
  assert.equal(readSavedRun(persistent)?.mode, 'run');
});
test('absent, corrupt and incompatible data are ignored without breaking startup', () => {
  const persistent = storage();
  assert.equal(readSavedRun(persistent), null);
  for (const raw of ['{bad', 'null', '[]', JSON.stringify({...draft, version:2,savedAt:123}), JSON.stringify({...draft, version:1,savedAt:123,code:42}), JSON.stringify({...draft, version:1,savedAt:123,mode:'invalid'})]) {
    persistent.setItem(SAVED_RUN_KEY, raw);
    assert.equal(readSavedRun(persistent), null);
  }
});
test('quota failure leaves previous saved run intact and reports save failure', () => {
  const persistent = storage();
  const previous = saveRun(draft, persistent);
  const unavailable = {...persistent, setItem: () => {throw new Error('QuotaExceededError');}};
  assert.equal(saveRun({...draft, code:'new code'}, unavailable), null);
  assert.deepEqual(readSavedRun(persistent), previous);
});
test('disabled browser storage does not throw or pretend code was saved', () => {
  const denied = {getItem: () => {throw new Error('SecurityError');}, setItem: () => {throw new Error('SecurityError');}};
  assert.equal(readSavedRun(denied), null);
  assert.equal(saveRun(draft, denied), null);
  assert.equal(saveRun(draft, null), null);
});
