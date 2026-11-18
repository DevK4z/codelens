import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutHeap, withHeap } from './src/engine/heap.ts';
import type { Heap, TraceEvent } from './src/engine/types.ts';

const node = (fields: Record<string, unknown>, type = 'Node') => ({ type, fields });
const list: Heap = {
  '0xa0': node({ head: '0x10', tail: '0x30' }, 'List'),
  '0x10': node({ value: 1, next: '0x20' }),
  '0x20': node({ value: 2, next: '0x30' }),
  '0x30': node({ value: 3, next: '0x0' }),
};
const tree: Heap = {
  '0x1': node({ key: 8, left: '0x2', right: '0x3' }),
  '0x2': node({ key: 3, left: '0x0', right: '0x0' }),
  '0x3': node({ key: 10, left: '0x0', right: '0x0' }),
};

test('a singly linked list reads left to right, ends in NULL and names its pointers', () => {
  const view = layoutHeap(list, { this: '0xa0', p: '0x20', q: '0x0' })!;
  assert.equal(view.shape, 'list');
  assert.deepEqual(view.nodes.map(n => n.text), ['1', '2', '3']);
  assert.ok(view.nodes[0].x < view.nodes[1].x && view.nodes[1].x < view.nodes[2].x);
  assert.equal(new Set(view.nodes.map(n => n.y)).size, 1);
  assert.deepEqual(view.nodes.map(n => n.labels), [['head'], ['p'], ['tail']]);
  assert.deepEqual(view.nullPointers, ['q']);
  assert.equal(view.ends.length, 1);
  assert.equal(view.ends[0].from, '0x30');
  assert.deepEqual(view.links.map(l => [l.from, l.to]), [['0x10', '0x20'], ['0x20', '0x30']]);
});

test('a handle held only by a calling frame still labels head and tail', () => {
  assert.deepEqual(layoutHeap(list, {})!.nodes.map(n => n.labels), [['head'], [], ['tail']]);
});

test('a binary tree is laid out in levels with the left child to the left', () => {
  const view = layoutHeap(tree, { root: '0x1' })!;
  assert.equal(view.shape, 'tree');
  const at = Object.fromEntries(view.nodes.map(n => [n.text, n]));
  assert.ok(at['3'].x < at['8'].x && at['8'].x < at['10'].x);
  assert.ok(at['8'].y < at['3'].y);
  assert.equal(at['3'].y, at['10'].y);
  assert.deepEqual(at['8'].labels, ['root']);
});

test('cycles and doubly linked nodes terminate and keep every node once', () => {
  const circular: Heap = { '0x1': node({ v: 1, next: '0x2' }), '0x2': node({ v: 2, next: '0x1' }) };
  const view = layoutHeap(circular, { head: '0x1' })!;
  assert.equal(view.nodes.length, 2);
  assert.equal(view.links.length, 2);
  const doubly: Heap = { '0x1': node({ v: 1, next: '0x2', prev: '0x0' }), '0x2': node({ v: 2, next: '0x0', prev: '0x1' }) };
  const both = layoutHeap(doubly, { head: '0x1' })!;
  assert.deepEqual(both.links.map(l => [l.field, l.primary]), [['next', true], ['prev', false]]);
  assert.equal(new Set(both.nodes.map(n => n.y)).size, 1, 'prev must not start a second row');
});

test('new and changed nodes are marked against the previous step', () => {
  const before: Heap = { '0x10': node({ value: 1, next: '0x0' }) };
  const after: Heap = { '0x10': node({ value: 1, next: '0x20' }), '0x20': node({ value: 2, next: '0x0' }) };
  assert.deepEqual(layoutHeap(after, {}, before)!.nodes.map(n => n.state), ['changed', 'new']);
  assert.deepEqual(layoutHeap(before, {}, before)!.nodes.map(n => n.state), ['same']);
});

test('nothing to draw yields no view, and a plain record is still a node', () => {
  assert.equal(layoutHeap(undefined, {}), undefined);
  assert.equal(layoutHeap({}, {}), undefined);
  assert.equal(layoutHeap({ '0x1': node({ age: 20 }, 'Student') }, { s: '0x1' }), undefined, 'a record without links is not a structure');
});

test('steps between recorded heaps carry the last one, and an emptied heap stays empty', () => {
  const event = (heap?: Heap) => ({ step: 0, line: 1, event: 'line', callStack: [], variables: {}, changed: [], ...(heap ? { heap } : {}) }) as TraceEvent;
  const out = withHeap([event(), event(tree), event(), event({}), event()]);
  assert.deepEqual(out.map(e => e.heap), [undefined, tree, tree, {}, {}]);
  assert.equal('heap' in out[0], false);
});

test('members of this join the variables, and locals shadow them', () => {
  const heap: Heap = { '0xa': node({ top: 2, a: [5, 3] }, 'Stack') };
  const [e] = withHeap([{ step: 0, line: 1, event: 'line', callStack: [], variables: { this: '0xa', top: 9 }, changed: [], heap } as TraceEvent]);
  assert.deepEqual(e.variables, { a: [5, 3], this: '0xa', top: 9 });
});

test('tree children named l and r are recognised', () => {
  assert.equal(layoutHeap({ '0x1': node({ c: '+', l: '0x2', r: '0x0' }), '0x2': node({ c: '3', l: '0x0', r: '0x0' }) }, {})!.shape, 'tree');
});
