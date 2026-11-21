import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InsertGuard, TabLock, changedSegments, devtoolsLikelyOpen, hasExtendedScreen } from './src/engine/proctoring.ts';
import type { ChannelLike } from './src/engine/proctoring.ts';

const starter = '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Viết lời giải ở đây\n\n    return 0;\n}';
const pasted = '    long long n; cin >> n; vector<long long> a(n); for (auto& x : a) cin >> x; sort(a.begin(), a.end());\n';

test('changedSegments finds what was removed and inserted', () => {
  assert.deepEqual(changedSegments('abcdef', 'abXYef'), { removed: 'cd', inserted: 'XY' });
  assert.deepEqual(changedSegments('aaa', 'aaaa'), { removed: '', inserted: 'a' });
  assert.deepEqual(changedSegments('same', 'same'), { removed: '', inserted: '' });
});

test('typing character by character is never flagged', () => {
  const guard = new InsertGuard(starter);
  const at = starter.indexOf('    // Viết');
  for (let i = 1; i <= pasted.length; i++) {
    assert.equal(guard.check(starter.slice(0, at) + pasted.slice(0, i) + starter.slice(at)), 0);
  }
});

test('a large block that never existed in the editor is flagged and can be undone', () => {
  const guard = new InsertGuard(starter);
  const withPaste = starter.replace('    // Viết lời giải ở đây\n', pasted);
  assert.ok(guard.check(withPaste) > 60);
  assert.equal(guard.accepted, starter, 'the accepted state is still the code before the paste');
});

test('undo/redo, duplicating own code and reformatting are not flagged', () => {
  const written = starter.replace('    // Viết lời giải ở đây\n', pasted);
  const guard = new InsertGuard(written); // e.g. code restored after reload
  // Delete the block, then undo (re-insert it).
  assert.equal(guard.check(starter), 0);
  assert.equal(guard.check(written), 0);
  // Duplicate the line (Shift+Alt+Down).
  assert.equal(guard.check(written.replace(pasted, pasted + pasted)), 0);
  // Reformat: only whitespace changes.
  assert.equal(guard.check(written.replace(pasted, pasted.replace(/; /g, ';\n    '))), 0);
});

test('small autocompletions stay below the threshold', () => {
  const guard = new InsertGuard(starter);
  assert.equal(guard.check(starter.replace('return 0;', 'for (int i = 0; i < n; i++) {}\n    return 0;')), 0);
});

test('devtools heuristic compensates for zoom', () => {
  const base = { outerWidth: 1440, innerWidth: 1440, outerHeight: 900, innerHeight: 900, devicePixelRatio: 2 };
  assert.equal(devtoolsLikelyOpen(base, 2), false);
  assert.equal(devtoolsLikelyOpen({ ...base, innerWidth: 1000 }, 2), true, 'docked to the side');
  assert.equal(devtoolsLikelyOpen({ ...base, innerHeight: 500 }, 2), true, 'docked to the bottom');
  // Zoom 150%: CSS viewport shrinks and devicePixelRatio grows by the same factor.
  assert.equal(devtoolsLikelyOpen({ ...base, innerWidth: 960, innerHeight: 600, devicePixelRatio: 3 }, 2), false);
});

test('extended screens are detected only when the browser reports them', () => {
  assert.equal(hasExtendedScreen({ isExtended: true }), true);
  assert.equal(hasExtendedScreen({ isExtended: false }), false);
  assert.equal(hasExtendedScreen({}), false);
  assert.equal(hasExtendedScreen(null), false);
});

// In-memory BroadcastChannel: every channel created from the same bus receives others' messages.
function bus() {
  const channels = new Set<ChannelLike>();
  return () => {
    const ch: ChannelLike = {
      onmessage: null,
      postMessage(message) { for (const other of channels) if (other !== ch) queueMicrotask(() => other.onmessage?.({ data: message })); },
      close() { channels.delete(ch); },
    };
    channels.add(ch);
    return ch;
  };
}

test('only the first tab owns the exam; a second tab is locked and the owner is told', async () => {
  const make = bus();
  const events: string[] = [];
  const first = new TabLock(make);
  await new Promise<void>(resolve => first.acquire({ waitMs: 20, onOwned: () => { events.push('first owned'); resolve(); }, onLocked: () => events.push('first locked'), onIntruder: () => events.push('intruder') }));
  const second = new TabLock(make);
  await new Promise<void>(resolve => second.acquire({ waitMs: 50, onOwned: () => { events.push('second owned'); resolve(); }, onLocked: () => { events.push('second locked'); resolve(); }, onIntruder: () => {} }));
  assert.deepEqual(events, ['first owned', 'intruder', 'second locked']);
  // After the owner closes, a new tab can take over.
  first.release(); second.release();
  const third = new TabLock(make);
  const result = await new Promise<string>(resolve => third.acquire({ waitMs: 20, onOwned: () => resolve('owned'), onLocked: () => resolve('locked'), onIntruder: () => {} }));
  assert.equal(result, 'owned');
  third.release();
});

test('without BroadcastChannel the tab simply owns the exam', () => {
  let owned = false;
  new TabLock(() => null).acquire({ onOwned: () => { owned = true; }, onLocked: () => {}, onIntruder: () => {} });
  assert.equal(owned, true);
});
