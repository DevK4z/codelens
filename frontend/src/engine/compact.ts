import type { TraceEvent } from './types.ts';
import { recursiveFunctions } from './insight.ts';
import { stripComment } from './lineFocus.ts';

const FUNCTION_HEADER = /^(?!(?:if|else|for|while|switch|return)\b)[\w:<>,&*~\s[\]]+\(.*\)\s*(?:const\s*)?\{?$/;

// GDB also stops on a function's header when entering it and on its closing brace when leaving.
// Neither runs anything the learner wrote, so they are dropped: variables and the call stack are
// unchanged at the next step. A recursive call's closing brace stays, since that is where it
// hands its result back.
export function compactTrace(trace: TraceEvent[], code: string): TraceEvent[] {
  const lines = code.split(/\r?\n/), recursive = recursiveFunctions(code);
  const kept = trace.filter((event, i) => {
    if (event.event !== 'line' || !event.detail?.startsWith('GCC/GDB:') || i === trace.length - 1) return true;
    const source = stripComment(lines[event.line - 1] ?? '').trim();
    const depth = event.callStack.length, before = trace[i - 1]?.callStack.length ?? 0, after = trace[i + 1]?.callStack.length ?? 0;
    if (depth > before && !source.endsWith(';') && FUNCTION_HEADER.test(source)) return false;
    const func = event.callStack[depth - 1]?.func ?? '';
    return !(/^\}\s*;?$/.test(source) && after < depth && !recursive.has(func));
  });
  return kept.length ? kept.map((event, step) => ({ ...event, step })) : trace;
}
