import type { TraceEvent } from './types.ts';
import { recursiveFunctions } from './insight.ts';
import { definedTypes, lineFocus, stripComment } from './lineFocus.ts';

const FUNCTION_HEADER = /^(?!(?:if|else|for|while|switch|return)\b)[\w:<>,&*~\s[\]]+\(.*\)\s*(?:const\s*)?\{?$/;

// GDB also stops on a function's header when entering it and on its closing brace when leaving.
// Neither runs anything the learner wrote, so they are dropped: variables and the call stack are
// unchanged at the next step. A recursive call's closing brace stays when it returns, since that is
// where it hands its result back.
export function compactTrace(trace: TraceEvent[], code: string): TraceEvent[] {
  const lines = code.split(/\r?\n/), recursive = recursiveFunctions(code);
  const kept = trace.filter((event, i) => {
    if (event.event !== 'line' || !event.detail?.startsWith('GCC/GDB:') || i === trace.length - 1) return true;
    const source = stripComment(lines[event.line - 1] ?? '').trim();
    const depth = event.callStack.length, before = trace[i - 1]?.callStack.length ?? 0, after = trace[i + 1]?.callStack.length ?? 0;
    if (depth > before && !source.endsWith(';') && FUNCTION_HEADER.test(source)) return false;
    // The jump to a one-line while's condition: the check that follows says the same with its result.
    const following = trace[i + 1];
    if (following?.loopCheck && following.line === event.line && !event.loopCheck && JSON.stringify(following.variables) === JSON.stringify(event.variables)) return false;
    const func = event.callStack[depth - 1]?.func ?? '';
    return !(/^\}\s*;?$/.test(source) && !(after < depth && recursive.has(func)));
  });
  return kept.length ? kept.map((event, step) => ({ ...event, step })) : trace;
}

interface Uninitialized { name: string; from: number; to: number }

// Locals of plain types declared without a value, with the lines where each is in scope.
function uninitializedLocals(code: string): Uninitialized[] {
  const types = ['long\\s+long', 'long', 'int', 'short', 'double', 'float', 'char', 'bool', 'size_t', ...definedTypes(code)].join('|');
  const declaration = new RegExp(String.raw`^(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:${types})\s+([^()=]+);$`);
  const found: Uninitialized[] = [];
  let depth = 0, open: Uninitialized[] = [];
  code.split(/\r?\n/).forEach((raw, index) => {
    const line = stripComment(raw).trim();
    const match = depth > 0 ? declaration.exec(line) : null;
    for (const part of match?.[1].split(',') ?? []) {
      const name = /^([A-Za-z_]\w*)\s*(?:\[[^\]]*\]\s*)*$/.exec(part.trim())?.[1];
      if (name) open.push({ name, from: index + 1, to: Infinity });
    }
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (depth === 0) {
      for (const item of open) found.push({ ...item, to: index + 1 });
      open = [];
    }
  });
  return found;
}

function maskLeaves(value: unknown, base: unknown, written: Set<string>, whole: boolean, path: string): unknown {
  if (Array.isArray(value)) return value.map((item, i) => maskLeaves(item, Array.isArray(base) ? base[i] : undefined, written, whole, `${path}/${i}`));
  if (whole || JSON.stringify(value) !== JSON.stringify(base)) written.add(path);
  return written.has(path) ? value : null;
}

// A local declared without a value holds whatever was in memory. GDB cannot tell that apart from a
// real value, so such a variable reads as unknown (null) until the program writes to it: its value
// changes, or the line just run writes it.
export function hideUninitialized(trace: TraceEvent[], code: string): TraceEvent[] {
  const candidates = uninitializedLocals(code);
  if (!candidates.length) return trace;
  const lines = code.split(/\r?\n/);
  const states = new Map<string, { base: unknown; written: Set<string> }>();
  return trace.map((event, i) => {
    if (event.event !== 'line') return event;
    const depth = event.callStack.length;
    for (const key of states.keys()) if (Number(key.split(':')[0]) > depth) states.delete(key);
    const previous = trace[i - 1];
    const sameCall = previous?.callStack.length === depth;
    const ran = sameCall ? lines[previous.line - 1] ?? '' : '';
    const writes = sameCall && previous.event === 'line' ? lineFocus(previous, event, code)?.refs.filter(r => r.access === 'write') ?? [] : [];
    let variables = event.variables;
    const unset: string[] = [];
    for (const { name, from, to } of candidates) {
      if (event.line < from || event.line > to || !Object.prototype.hasOwnProperty.call(event.variables, name)) continue;
      const key = `${depth}:${name}:${from}`, value = event.variables[name];
      if (value === null) { states.delete(key); continue; }
      const state = states.get(key) ?? { base: value, written: new Set<string>() };
      states.set(key, state);
      for (const ref of writes) if (ref.array === name) state.written.add(['', ...ref.indices].join('/'));
      const assigned = new RegExp(`(?:\\b${name}\\s*(?:[-+*/%]?=(?!=)|\\+\\+|--)|(?:\\+\\+|--|>>\\s*|&\\s*)${name}\\b)`).test(ran);
      // Handed to something that can write it: an argument (memset, a reference parameter) or a pointer.
      const whole = assigned || new RegExp(`[(,]\\s*${name}\\s*[-+,)]|\\*\\s*\\w+\\s*=\\s*${name}\\b`).test(ran);
      const masked = maskLeaves(value, state.base, state.written, whole, '');
      if (masked !== value) variables = { ...variables, [name]: masked };
      if (masked === null) unset.push(name);
    }
    if (variables === event.variables) return event;
    return { ...event, variables, ...(unset.length ? { unset } : {}) };
  });
}

function resolvePointer(expression: string, event: TraceEvent): string | undefined {
  const [first, ...fields] = expression.trim().split('->').map(part => part.trim());
  let value: unknown = event.variables[first];
  for (const field of fields) value = event.heap?.[String(value).split(' ')[0]]?.fields[field];
  return typeof value === 'string' && value.startsWith('0x') ? value.split(' ')[0] : undefined;
}

// The tracer reads memory, and memory keeps a deleted node's bytes. The program said it is gone, so
// it leaves the picture from the next step, until new hands that address out again with new contents.
export function dropDeletedNodes(trace: TraceEvent[], code: string): TraceEvent[] {
  if (!/\bdelete\b/.test(code)) return trace;
  const lines = code.split(/\r?\n/), freed = new Map<string, string>();
  return trace.map((event, i) => {
    const previous = trace[i - 1];
    if (previous) {
      const source = stripComment(lines[previous.line - 1] ?? '').trim();
      const target = /^delete(?:\s*\[\s*\])?\s+([^;]+);/.exec(source)?.[1];
      const address = target ? resolvePointer(target, previous) : undefined;
      if (address && previous.heap?.[address]) freed.set(address, JSON.stringify(previous.heap[address]));
      if (/\bnew\b/.test(source)) for (const [key, node] of freed) if (event.heap?.[key] && JSON.stringify(event.heap[key]) !== node) freed.delete(key);
    }
    if (!event.heap || ![...freed.keys()].some(key => event.heap![key])) return event;
    return { ...event, heap: Object.fromEntries(Object.entries(event.heap).filter(([key]) => !freed.has(key))) };
  });
}
