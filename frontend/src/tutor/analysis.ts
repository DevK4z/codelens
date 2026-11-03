// Facts the tutor derives from a whole recorded run: how a variable evolved and what looks wrong.
import type { TraceEvent } from '../engine/types.ts';
import { indexable, lineFocus, stripComment } from '../engine/lineFocus.ts';
import { formatObserved } from '../engine/stepState.ts';

export const show = (v: unknown) => typeof v === 'string' && v.length === 1 ? `'${v}'` : formatObserved(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export interface Change { step: number; line: number; value: unknown }

// Values a variable took during the call the given step belongs to, one entry per change. Frames
// carry no ids, so a call is the stretch of steps during which the stack stays at least this deep;
// within it only steps where this call is on top count (not its recursive children).
export function variableHistory(trace: TraceEvent[], name: string, step: number): Change[] {
  const depth = trace[step]?.callStack.length ?? 0;
  let start = step, end = step;
  while (start > 0 && trace[start - 1].callStack.length >= depth) start--;
  while (end < trace.length - 1 && trace[end + 1].callStack.length >= depth) end++;
  const changes: Change[] = [];
  trace.slice(start, end + 1).forEach((event, offset) => {
    if (event.callStack.length !== depth || !Object.prototype.hasOwnProperty.call(event.variables, name)) return;
    const step = start + offset, value = event.variables[name];
    if (value === null) return;
    if (!changes.length || !same(changes[changes.length - 1].value, value)) changes.push({ step, line: event.line, value });
  });
  return changes;
}

export interface Issue { step: number; line: number; kind: 'out_of_range' | 'overflow' | 'endless' | 'runtime' | 'compile'; text: string }

const INT_LIMIT = 2_000_000_000;

export function findIssues(trace: TraceEvent[], code: string, status: { runtimeError?: string; compilationError?: string; timeLimitExceeded?: boolean; stepLimitExceeded?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  if (status.compilationError) {
    const first = status.compilationError.split('\n').find(l => /error/i.test(l)) ?? status.compilationError.split('\n')[0];
    const line = Number(/:(\d+):\d+:/.exec(first)?.[1] ?? 0);
    issues.push({ step: -1, line, kind: 'compile', text: `Code chưa biên dịch được${line ? ` (dòng ${line})` : ''}: ${first.replace(/^.*?error:\s*/, '').trim()}` });
    return issues;
  }
  const lines = code.split(/\r?\n/);
  const seen = new Set<string>();
  trace.forEach((event, step) => {
    const source = stripComment(lines[event.line - 1] ?? '');
    // Conditional expressions legitimately name cells they never touch (dp[i-1][j] when i == 0).
    if (!/[?]|&&|\|\|/.test(source)) {
      for (const ref of lineFocus(event, trace[step + 1], code)?.refs ?? []) {
        const items = indexable(event.variables[ref.array]);
        if (ref.inRange || !items || items.length >= 100) continue;
        const key = `${event.line}:${ref.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        issues.push({ step, line: event.line, kind: 'out_of_range', text: `Dòng ${event.line} ${ref.access === 'write' ? 'ghi vào' : 'đọc'} \`${ref.text}\` = \`${ref.array}[${ref.indices.join('][')}]\` nhưng \`${ref.array}\` chỉ có ${items.length} phần tử (chỉ số hợp lệ 0..${items.length - 1}). Truy cập ngoài mảng là hành vi không xác định: có thể ra số rác hoặc làm chương trình dừng đột ngột.` });
      }
    }
    for (const [name, value] of Object.entries(event.variables)) {
      if (typeof value === 'number' && Number.isInteger(value) && Math.abs(value) >= INT_LIMIT && !seen.has(`overflow:${name}`)) {
        seen.add(`overflow:${name}`);
        issues.push({ step, line: event.line, kind: 'overflow', text: `\`${name}\` = ${value} ở bước ${step + 1}, sát giới hạn của int (khoảng ±2.1 tỉ). Phép tính tiếp theo có thể tràn số; cân nhắc dùng long long.` });
      }
    }
  });
  if (status.timeLimitExceeded || status.stepLimitExceeded) {
    const counts = new Map<number, number>();
    for (const e of trace) counts.set(e.line, (counts.get(e.line) ?? 0) + 1);
    const [line, times] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
    issues.push({ step: -1, line, kind: 'endless', text: `Chương trình ${status.timeLimitExceeded ? 'chạy quá thời gian cho phép' : 'vượt giới hạn số bước ghi lại'}${line ? `; dòng ${line} lặp lại nhiều nhất (${times} lần trong bản ghi)` : ''}. Hãy kiểm tra điều kiện dừng của vòng lặp hoặc trường hợp cơ sở của đệ quy: biến điều khiển có thực sự tiến về phía điều kiện dừng không?` });
  } else if (status.runtimeError) {
    issues.push({ step: trace.length - 1, line: trace[trace.length - 1]?.line ?? 0, kind: 'runtime', text: `Chương trình dừng bất thường: ${status.runtimeError.split('\n')[0]}` });
  }
  return issues;
}

// Text the program has printed by the end of the run.
export const finalOutput = (trace: TraceEvent[]) => trace.length ? trace[trace.length - 1].stdout ?? '' : '';

// How deeply loops nest and whether the code halves a range or recurses, for complexity reasoning.
export function loopShape(code: string): { depth: number; halving: boolean } {
  const text = code.split(/\r?\n/).map(stripComment).join('\n');
  let depth = 0, max = 0;
  const stack: boolean[] = [];
  const tokens = text.match(/\b(?:for|while)\s*\(|[{}]/g) ?? [];
  let pendingLoop = false;
  for (const t of tokens) {
    if (t === '{') { stack.push(pendingLoop); if (pendingLoop) { depth++; max = Math.max(max, depth); } pendingLoop = false; }
    else if (t === '}') { if (stack.pop()) depth--; }
    else { pendingLoop = true; max = Math.max(max, depth + 1); }
  }
  return { depth: max, halving: /\bmid\b|\/\s*2\b|>>\s*1/.test(text) };
}
