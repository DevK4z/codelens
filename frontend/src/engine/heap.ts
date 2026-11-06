import type { Heap, HeapNode, TraceEvent } from './types.ts';

// Turns the structures the tracer read from memory into something drawable: which nodes exist, how
// they link, where each pointer variable points, and a layout (rows for lists, levels for trees).

export const NODE_LIMIT = 64;
const NULL = '0x0';
const LEFT = /^(?:p?left|l|lchild|leftchild|trai)$/i;
const RIGHT = /^(?:p?right|r|rchild|rightchild|phai)$/i;
const NEXT = /next|^link$|^sau$/i;
const LINK_NAME = /^(?:p?next|p?prev|p?previous|link|p?left|p?right|l|r|lchild|rchild|leftchild|rightchild|trai|phai|sau|truoc)$/i;

const addressOf = (value: unknown) => typeof value === 'string' ? /^0x[0-9a-f]+/.exec(value)?.[0] : undefined;
const pointerFields = (node: HeapNode) => Object.entries(node.fields).flatMap(([field, value]) => {
  const to = addressOf(value);
  return to ? [{ field, to }] : [];
});

// The tracer records the heap only when it changes; give every step the one in effect. Inside a
// method the members are what the code talks about, so they join the variables (locals shadow them).
export function withHeap(trace: TraceEvent[]): TraceEvent[] {
  let heap: Heap | undefined;
  return trace.map(event => {
    if (event.heap) heap = event.heap;
    if (!heap) return event;
    const self = heap[addressOf(event.variables.this) ?? ''];
    return { ...event, heap, ...(self ? { variables: { ...self.fields, ...event.variables } } : {}) };
  });
}

export interface PlacedNode { address: string; type: string; text: string; title: string; x: number; y: number; labels: string[]; state: 'new' | 'changed' | 'same' }
export interface Link { from: string; to: string; field: string; primary: boolean }
export interface HeapView {
  shape: 'tree' | 'list';
  typeName: string;
  nodes: PlacedNode[];
  links: Link[];
  ends: { from: string; x: number; y: number }[];
  nullPointers: string[];
  limited: boolean;
  width: number;
  height: number;
  box: { width: number; height: number };
  stepX: number;
}

const shortValue = (value: unknown) => {
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 8 ? `${text.slice(0, 7)}…` : text;
};

export function layoutHeap(heap: Heap | undefined, variables: Record<string, unknown>, previous?: Heap): HeapView | undefined {
  if (!heap || !Object.keys(heap).length) return undefined;

  // A struct that only holds pointers to other types (List { head, tail }) is a handle, not a node.
  const linked = new Set<string>();
  for (const node of Object.values(heap)) for (const { field, to } of pointerFields(node))
    if (heap[to]?.type === node.type || LINK_NAME.test(field)) linked.add(node.type);
  const isHandle = (node: HeapNode) => !linked.has(node.type) && pointerFields(node).length > 0;
  const shown = Object.keys(heap).filter(address => !isHandle(heap[address]));
  // Plain records (an array-based Stack behind this) have no links to draw.
  if (!shown.some(address => linked.has(heap[address].type))) return undefined;

  const labels = new Map<string, string[]>();
  const nullPointers: string[] = [];
  const label = (address: string, name: string) => {
    const list = labels.get(address) ?? [];
    if (!list.includes(name)) labels.set(address, [...list, name]);
  };
  const seenHandles = new Set<string>();
  const handleFields = (address: string, prefix: string) => {
    seenHandles.add(address);
    for (const { field, to } of pointerFields(heap[address])) {
      if (to === NULL) nullPointers.push(`${prefix}${field}`);
      else if (heap[to]) label(to, `${prefix}${field}`);
    }
  };
  const visit = (name: string, value: unknown, depth: number) => {
    const address = addressOf(value);
    if (address === NULL) nullPointers.push(name);
    else if (address && heap[address]) {
      if (isHandle(heap[address])) handleFields(address, name === 'this' ? '' : `${name}->`);
      else label(address, name);
    } else if (depth < 3 && Array.isArray(value)) value.forEach((item, i) => visit(`${name}[${i}]`, item, depth + 1));
    else if (depth < 3 && value && typeof value === 'object') for (const [key, item] of Object.entries(value)) visit(`${name}.${key}`, item, depth + 1);
  };
  for (const [name, value] of Object.entries(variables)) visit(name, value, 0);
  // Handles held by a calling function (main's List) still name their head and tail.
  for (const address of Object.keys(heap)) if (isHandle(heap[address]) && !seenHandles.has(address)) handleFields(address, '');

  const isShown = (address: string) => !!heap[address] && !isHandle(heap[address]);
  const tree = shown.some(a => Object.keys(heap[a].fields).some(f => LEFT.test(f)) && Object.keys(heap[a].fields).some(f => RIGHT.test(f)));
  const children = (address: string) => pointerFields(heap[address]).filter(({ to }) => isShown(to));
  const primaryField = (address: string) => {
    const links = pointerFields(heap[address]);
    return (links.find(l => NEXT.test(l.field)) ?? links.find(l => heap[l.to]?.type === heap[address].type) ?? links[0])?.field;
  };

  const incoming = new Set(shown.flatMap(a => children(a).filter(c => tree || c.field === primaryField(a)).map(c => c.to)));
  // Labelled entry points first, so head comes before anything detached.
  const starts = [...shown.filter(a => !incoming.has(a) && labels.has(a)), ...shown.filter(a => !incoming.has(a) && !labels.has(a)), ...shown];

  const place = new Map<string, { col: number; row: number }>();
  const ends: { from: string; col: number; row: number }[] = [];
  if (tree) {
    let col = 0, top = 0, deepest = 0;
    const walk = (address: string, depth: number) => {
      if (place.has(address)) return;
      place.set(address, { col: -1, row: depth });
      const links = pointerFields(heap[address]);
      const side = (test: RegExp) => links.find(l => test.test(l.field) && isShown(l.to))?.to;
      const left = side(LEFT), right = side(RIGHT);
      if (left) walk(left, depth + 1);
      place.get(address)!.col = col++;
      if (right) walk(right, depth + 1);
      deepest = Math.max(deepest, depth);
    };
    for (const start of starts) if (!place.has(start)) { walk(start, top); top = deepest + 1; }
  } else {
    let row = 0;
    for (const start of starts) {
      if (place.has(start)) continue;
      let col = 0, at: string | undefined = start;
      while (at && !place.has(at)) {
        place.set(at, { col: col++, row });
        const field = primaryField(at);
        const value: string | undefined = field ? addressOf(heap[at].fields[field]) : undefined;
        if (value === NULL) ends.push({ from: at, col, row });
        at = value && isShown(value) ? value : undefined;
      }
      row++;
    }
  }

  const box = tree ? { width: 60, height: 36 } : { width: 64, height: 40 };
  const stepX = tree ? 70 : 96, stepY = tree ? 82 : 92, top = 30, side = 12;
  const px = (col: number) => side + col * stepX;
  const py = (row: number) => top + row * stepY;
  const nodes: PlacedNode[] = shown.filter(a => place.has(a)).map(address => {
    const node = heap[address], at = place.get(address)!;
    const data = Object.entries(node.fields).filter(([, value]) => !addressOf(value));
    const text = data.length === 1 ? shortValue(data[0][1]) : data.map(([key, value]) => `${key}=${shortValue(value)}`).join(' ');
    const before = previous?.[address];
    return {
      address, type: node.type, text: text.length > 14 ? `${text.slice(0, 13)}…` : text,
      title: `${node.type}: ${JSON.stringify(node.fields)}`,
      x: px(at.col), y: py(at.row), labels: labels.get(address) ?? [],
      state: !previous ? 'same' : !before ? 'new' : JSON.stringify(before) !== JSON.stringify(node) ? 'changed' : 'same',
    };
  });
  const links: Link[] = shown.filter(a => place.has(a)).flatMap(address => children(address)
    .filter(({ to }) => place.has(to))
    .map(({ field, to }) => ({ from: address, to, field, primary: tree || field === primaryField(address) })));
  const placedEnds = ends.map(e => ({ from: e.from, x: px(e.col), y: py(e.row) }));
  const right = Math.max(...nodes.map(n => n.x), ...placedEnds.map(e => e.x)) + box.width + side;
  const bottom = Math.max(...nodes.map(n => n.y)) + box.height + (tree ? 12 : 30);
  return {
    shape: tree ? 'tree' : 'list', typeName: heap[shown[0]].type, nodes, links, ends: placedEnds,
    nullPointers: [...new Set(nullPointers)], limited: Object.keys(heap).length >= NODE_LIMIT, width: right, height: bottom, box, stepX,
  };
}
