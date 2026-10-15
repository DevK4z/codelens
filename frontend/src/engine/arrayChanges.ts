import type { TraceEvent } from './types';

// Compare snapshots only within the same observable call context. These are
// value changes, not proof of a write or of initialization.
export function changedArrayIndices(event: TraceEvent, previous: TraceEvent | null | undefined, name: string): Set<number> {
  const result = new Set<number>();
  if (!previous || !event.callStack.length || event.callStack.length !== previous.callStack.length) return result;
  if (event.callStack.some((frame, i) => {
    const before = previous.callStack[i];
    return frame.func !== before.func || frame.id !== before.id || (i < event.callStack.length - 1 && frame.line !== before.line);
  })) return result;
  const current = event.variables[name];
  const before = previous.variables[name];
  if (!Array.isArray(current) || !Array.isArray(before)) return result;
  current.forEach((value, i) => {
    if (i < before.length && JSON.stringify(value) !== JSON.stringify(before[i])) result.add(i);
  });
  return result;
}
