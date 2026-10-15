import type { TraceEvent } from './types';

export function sameCallContext(a: TraceEvent, b?: TraceEvent | null): boolean {
  return !!b && a.callStack.length > 0 && a.callStack.length === b.callStack.length && a.callStack.every((f, i) => {
    const old = b.callStack[i];
    return f.func === old.func && f.id === old.id && (i === a.callStack.length - 1 || f.line === old.line);
  });
}

export function formatObserved(value: unknown): string {
  if (value === null) return '? (chưa xác định)';
  if (value === undefined || value === '<unavailable>') return 'Không đọc được';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > 160 ? text.slice(0, 157) + '…' : text;
}

export function observedScalars(event: TraceEvent, previous?: TraceEvent | null) {
  const comparable = sameCallContext(event, previous);
  return Object.entries(event.variables).filter(([,value]) => !Array.isArray(value) && (value === null || typeof value !== 'object')).map(([name,value]) => {
    const hasBefore = comparable && Object.prototype.hasOwnProperty.call(previous!.variables, name);
    const before = hasBefore ? previous!.variables[name] : undefined;
    return {name,value,before,changed:hasBefore && JSON.stringify(before) !== JSON.stringify(value)};
  });
}
