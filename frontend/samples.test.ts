import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES } from './src/data/exercises.ts';
import { EXERCISE_SOLUTIONS } from './src/data/exerciseSolutions.ts';

test('every exercise has a complete, documented, runnable reference with sample output', () => {
  assert.equal(EXERCISES.length, 104);
  assert.deepEqual(Object.keys(EXERCISE_SOLUTIONS).sort(), EXERCISES.map(e => e.id).sort());
  for (const e of EXERCISES) {
    const s = EXERCISE_SOLUTIONS[e.id];
    assert.match(s.code, /int main\(/, e.id);
    assert.ok(s.note.length > 20, e.id);
    assert.equal(typeof s.stdin, 'string');
    assert.equal(typeof s.output, 'string');
  }
});
