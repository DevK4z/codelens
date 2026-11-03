import type { CallFrame, TraceEvent } from './types.ts';
import { activeRange, controlledRange, evaluate, indexable, stripComment, type LineFocus } from './lineFocus.ts';
import { sameCallContext, formatObserved } from './stepState.ts';

// "Why" behind a step: what the line means for the algorithm being written. Every claim is
// checked against the recorded values first (a sum really equals the prefix, the tail really is
// sorted), so a pattern that only looks familiar never produces a wrong explanation.

export type AlgorithmId = 'binary-search' | 'bubble-sort' | 'dp' | 'two-pointers' | 'recursion' | 'max-min' | 'accumulate';
export interface AlgorithmIdea { id: AlgorithmId; name: string; idea: string; complexity: string }

const IDEAS: Record<AlgorithmId, Omit<AlgorithmIdea, 'id'>> = {
  'binary-search': { name: 'Tìm kiếm nhị phân', complexity: 'O(log n)', idea: 'Mảng đã sắp xếp tăng dần: so sánh phần tử ở giữa vùng tìm với giá trị cần tìm, mỗi lần loại được một nửa vùng.' },
  'bubble-sort': { name: 'Sắp xếp nổi bọt', complexity: 'O(n²)', idea: 'So sánh từng cặp phần tử kề nhau và đổi chỗ nếu sai thứ tự. Sau mỗi lượt, phần tử lớn nhất còn lại "nổi" về cuối mảng.' },
  dp: { name: 'Quy hoạch động', complexity: 'O(số ô × chi phí mỗi ô)', idea: 'Mỗi ô lưu đáp án của một bài toán con. Ô mới được tính từ các ô đã tính trước nên không phải giải lại bài toán con nào.' },
  'two-pointers': { name: 'Hai con trỏ', complexity: 'O(n)', idea: 'Hai chỉ số xuất phát từ hai đầu và tiến vào giữa; mỗi bước loại bớt phần tử nên chỉ cần duyệt mảng một lần.' },
  recursion: { name: 'Đệ quy', complexity: 'Mỗi lời gọi chiếm một frame trên ngăn xếp', idea: 'Hàm gọi lại chính nó với bài toán nhỏ hơn cho tới trường hợp cơ sở, rồi ghép kết quả khi các lời gọi lần lượt trả về.' },
  'max-min': { name: 'Tìm lớn nhất / nhỏ nhất', complexity: 'O(n)', idea: 'Giữ giá trị tốt nhất đã thấy; duyệt từng phần tử, gặp phần tử tốt hơn thì cập nhật.' },
  accumulate: { name: 'Duyệt và cộng dồn', complexity: 'O(n)', idea: 'Duyệt lần lượt từng phần tử và cộng vào biến tổng; sau bước thứ k, biến tổng bằng tổng của k phần tử đầu.' },
};

const clean = (code: string) => code.split(/\r?\n/).map(stripComment).join('\n');
const flat = (code: string) => clean(code).replace(/\s+/g, ' ');
const isInt = (v: unknown): v is number => Number.isInteger(v);
const show = (v: unknown) => typeof v === 'string' && v.length === 1 ? `'${v}'` : formatObserved(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Functions whose body calls themselves.
export function recursiveFunctions(code: string): Set<string> {
  const text = clean(code), result = new Set<string>();
  for (const m of text.matchAll(/\b([A-Za-z_]\w*)\s*\(([^;{}()]*)\)\s*\{/g)) {
    const name = m[1];
    if (['if', 'for', 'while', 'switch', 'main', 'catch'].includes(name)) continue;
    let depth = 0, i = m.index! + m[0].length - 1;
    for (; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}' && --depth === 0) break;
    }
    if (new RegExp(`\\b${name}\\s*\\(`).test(text.slice(m.index! + m[0].length, i))) result.add(name);
  }
  return result;
}

export function detectAlgorithm(code: string): AlgorithmIdea | undefined {
  const text = flat(code);
  const twoPointer = /while\s*\(\s*(\w+)\s*<=?\s*(\w+)\s*\)/.exec(text);
  const checks: [AlgorithmId, boolean][] = [
    ['binary-search', /\bmid\s*=\s*(?:\(\s*\w+\s*\+\s*\w+\s*\)\s*(?:\/\s*2|>>\s*1)|\w+\s*\+\s*\(\s*\w+\s*-\s*\w+\s*\)\s*\/\s*2)/.test(text)],
    ['bubble-sort', /(\w+)\s*\[\s*(\w+)\s*\]\s*[<>]\s*\1\s*\[\s*\2\s*\+\s*1\s*\]/.test(text)],
    ['dp', /\b(dp\w*)\s*(?:\[[^\]]*\]\s*){1,2}\+?=[^;]*\b\1\s*\[/.test(text)],
    ['two-pointers', !!twoPointer && new RegExp(`(?:\\b${twoPointer[1]}\\s*\\+\\+|\\+\\+\\s*${twoPointer[1]}\\b)`).test(text) && new RegExp(`(?:\\b${twoPointer[2]}\\s*--|--\\s*${twoPointer[2]}\\b)`).test(text)],
    ['recursion', recursiveFunctions(code).size > 0],
    ['max-min', /if\s*\(\s*\w+\s*\[\s*\w+\s*\]\s*[<>]=?\s*(\w+)\s*\)\s*\{?\s*\1\s*=\s*\w+\s*\[/.test(text)],
    ['accumulate', /\b\w+\s*\+=\s*\w+\s*\[\s*\w+\s*\]/.test(text)],
  ];
  const found = checks.find(([, ok]) => ok)?.[0];
  return found && { id: found, ...IDEAS[found] };
}

// Value of a small expression such as "n - 1 - i" or "s.size() - 1" under the given variables.
function valueOf(expr: string, vars: Record<string, unknown>): number | undefined {
  const text = expr
    .replace(/\b([A-Za-z_]\w*)\s*\.\s*(?:size|length)\s*\(\s*\)/g, (whole, name) => { const items = indexable(vars[name]); return items ? String(items.length) : whole; })
    .replace(/\b([A-Za-z_]\w*)\b/g, (whole, name) => typeof vars[name] === 'number' ? String(vars[name]) : whole);
  const v = evaluate(text);
  return typeof v === 'number' ? v : undefined;
}

const cell = (vars: Record<string, unknown>, name: string, indices: number[]): unknown => {
  let value: unknown = vars[name];
  for (const i of indices) value = indexable(value)?.[i];
  return value;
};

const call = (frame: CallFrame | undefined) => {
  if (!frame) return 'hàm gọi';
  const params = frame.params && Object.values(frame.params);
  return params && params.length ? `${frame.func}(${params.map(show).join(', ')})` : frame.func;
};

interface CountedLoop { name: string; init: string; op: string; bound: string; delta: number }

// "for (int i = a; i < b; i++)" style headers, the only loops whose round number is well defined.
function countedLoop(source: string): CountedLoop | undefined {
  const m = /^for\s*\(([^;]*);([^;]*);([^)]*)\)/.exec(source);
  const init = m && /^\s*(?:[\w:<>]+\s+)?([A-Za-z_]\w*)\s*=\s*(.+?)\s*$/.exec(m[1]);
  if (!m || !init) return undefined;
  const name = init[1];
  const cond = new RegExp(`^\\s*${name}\\s*(<=|<|>=|>)\\s*(.+?)\\s*$`).exec(m[2]);
  const step = new RegExp(`^\\s*(?:${name}\\s*(\\+\\+|--)|(\\+\\+|--)\\s*${name}|${name}\\s*([+-])=\\s*(\\d+))\\s*$`).exec(m[3]);
  if (!cond || !step) return undefined;
  const delta = step[1] || step[2] ? ((step[1] || step[2]) === '++' ? 1 : -1) : (step[3] === '+' ? 1 : -1) * Number(step[4]);
  if ((delta > 0) !== cond[1].startsWith('<')) return undefined;
  return { name, init: init[2], op: cond[1], bound: cond[2].trim(), delta };
}

// Round k of total when the loop variable holds `value`; bounds are evaluated under `vars`.
function round(loop: CountedLoop, vars: Record<string, unknown>, value: unknown): { k: number; total: number; bound: number } | undefined {
  const start = valueOf(loop.init, vars), bound = valueOf(loop.bound, vars);
  if (start === undefined || bound === undefined) return undefined;
  const span = loop.delta > 0 ? bound - start : start - bound, step = Math.abs(loop.delta);
  const total = Math.max(0, loop.op.length === 2 ? Math.floor(span / step) + 1 : Math.ceil(span / step));
  if (!isInt(value)) return { k: 0, total, bound };
  const k = (value - start) / loop.delta + 1;
  return Number.isInteger(k) && k >= 1 && k <= total ? { k, total, bound } : undefined;
}

const boundNote = (loop: CountedLoop, bound: number) => /^\d+$/.test(loop.bound) ? loop.bound : `${loop.bound} = ${bound}`;

function loopProgress(source: string, focus: LineFocus, vars: Record<string, unknown>, after?: Record<string, unknown>): string | undefined {
  const loop = countedLoop(source);
  if (!loop || !focus.outcome) return undefined;
  if (!focus.outcome.taken) {
    const r = round(loop, vars, undefined);
    return r && r.total > 0 ? `Vòng ${loop.name} đã chạy đủ ${r.total} lần (${loop.name} ${loop.op} ${boundNote(loop, r.bound)} không còn đúng) nên kết thúc.` : undefined;
  }
  const value = after?.[loop.name];
  const r = after && round(loop, after, value);
  if (!r || !r.k) return undefined;
  return `Lần lặp thứ ${r.k}/${r.total} của vòng ${loop.name}: ${loop.name} = ${value} (lặp khi ${loop.name} ${loop.op} ${boundNote(loop, r.bound)}).${r.k === r.total && r.total > 1 ? ' Đây là lần lặp cuối.' : ''}`;
}

// Which round of each enclosing counted loop the current line runs in, outermost first.
export function loopContext(event: TraceEvent, code: string): string[] {
  const lines = code.split(/\r?\n/), result: string[] = [];
  lines.forEach((raw, index) => {
    const line = index + 1;
    if (line >= event.line) return;
    const loop = countedLoop(stripComment(raw).replace(/^\}\s*/, ''));
    const body = loop && controlledRange(code, line);
    if (!loop || !body || event.line < body.bodyStart || event.line > body.end) return;
    const r = round(loop, event.variables, event.variables[loop.name]);
    if (r?.k) result.push(`vòng ${loop.name}: lần ${r.k}/${r.total}`);
  });
  return result;
}

// Values returned by calls of recursive functions, keyed by the step at which each call ends.
// GDB stops at a function's closing brace, not after its return, so the value is rebuilt from the
// frame's last return expression, its variables and the value its own recursive call returned.
export function recursiveReturns(trace: TraceEvent[], code: string): Map<number, { call: string; work?: string; value?: number; caller: string }> {
  const recursive = recursiveFunctions(code), lines = code.split(/\r?\n/);
  const pending = new Map<number, { expr: string; vars: Record<string, unknown> }>(), childValue = new Map<number, number>();
  const result = new Map<number, { call: string; work?: string; value?: number; caller: string }>();
  trace.forEach((event, i) => {
    const depth = event.callStack.length, frame = event.callStack[depth - 1];
    if (!frame || !recursive.has(frame.func)) return;
    const source = stripComment(lines[event.line - 1] ?? '').trim();
    const ret = /^return\s+(.+?);?$/.exec(source);
    if (ret) { pending.set(depth, { expr: ret[1], vars: event.variables }); childValue.delete(depth); }
    const next = trace[i + 1];
    if (!next || next.callStack.length >= depth || !next.callStack.length) return;
    const info = pending.get(depth);
    let work: string | undefined, value: number | undefined;
    if (info) {
      const replaced = info.expr.replace(new RegExp(`\\b${frame.func}\\s*\\([^()]*\\)`, 'g'), () => childValue.has(depth) ? String(childValue.get(depth)) : '?');
      const filled = replaced.replace(/\b([A-Za-z_]\w*)\b/g, (whole, name) => typeof info.vars[name] === 'number' ? String(info.vars[name]) : whole);
      const v = evaluate(filled);
      if (typeof v === 'number') { value = v; work = filled.trim() === String(v) ? undefined : filled.trim(); }
    }
    pending.delete(depth);
    if (value !== undefined) childValue.set(depth - 1, value);
    result.set(i, { call: call(frame), work, value, caller: call(next.callStack[next.callStack.length - 1]) });
  });
  return result;
}

export type ReturnedValue = ReturnType<typeof recursiveReturns> extends Map<number, infer V> ? V : never;

export function lineInsight(event: TraceEvent, next: TraceEvent | null | undefined, code: string, focus: LineFocus | undefined, algorithm = detectAlgorithm(code), returned?: ReturnedValue): string[] {
  // A recursive call ending at its closing brace has no line to describe, only a value to hand back.
  if (returned) return [`${returned.call} trả về ${returned.value === undefined ? 'kết quả' : returned.work ? `${returned.work} = ${returned.value}` : returned.value} cho ${returned.caller} đang chờ.`];
  if (!focus) return [];
  const out: string[] = [];
  const vars = event.variables;
  const sameFrame = !!next && sameCallContext(next, event);
  const after = sameFrame ? next!.variables : undefined;
  const source = stripComment(code.split(/\r?\n/)[event.line - 1] ?? '').replace(/^\}\s*/, '').replace(/[;{]\s*$/, '').trim();
  const text = flat(code);
  const cond = /^(?:else\s+)?(?:if|while)\s*\((.*)\)$/.exec(source)?.[1]?.trim();
  const reads = focus.refs.filter(r => r.access === 'read' && r.inRange);
  const writes = focus.refs.filter(r => r.access === 'write' && r.inRange);
  const frame = event.callStack[event.callStack.length - 1];

  // Loops: which round this is and how many there are.
  if (focus.kind === 'for') {
    const progress = loopProgress(source, focus, vars, after);
    if (progress) out.push(progress);
    // Bubble sort: when a pass starts (the inner loop bounded by n - 1 - i), the i largest values
    // already sit, sorted, at the end.
    if (algorithm?.id === 'bubble-sort' && focus.outcome?.taken && after) {
      const outer = /<\s*\w+\s*-\s*(?:1\s*-\s*(\w+)|(\w+)\s*-\s*1)/.exec(source);
      const name = outer?.[1] ?? outer?.[2];
      const arrayName = /(\w+)\s*\[\s*\w+\s*\]\s*[<>]\s*\1\s*\[/.exec(text)?.[1];
      const items = arrayName ? indexable(after[arrayName]) : undefined;
      const k = name ? after[name] : undefined;
      if (items && isInt(k) && k > 0) {
        const n = isInt(after.n) && after.n <= items.length ? after.n : items.length;
        const values = items.slice(0, n) as unknown[];
        const sorted = [...values].sort((a, b) => Number(a) - Number(b));
        const tail = values.slice(n - k);
        if (k < n && values.every(v => typeof v === 'number') && same(tail, sorted.slice(n - k)))
          out.push(`Sau ${k} lượt, ${k} số lớn nhất (${tail.join(', ')}) đã nằm đúng chỗ ở cuối mảng; lượt này chỉ cần xét ${arrayName}[0..${n - 1 - k}].`);
      }
    }
  }

  // A left..right style range that this line shrinks.
  const range = activeRange(vars, Object.keys(vars));
  if (range && after && isInt(after[range.from]) && isInt(after[range.to])) {
    const [a, b, c, d] = [vars[range.from], vars[range.to], after[range.from], after[range.to]] as number[];
    if ((a !== c || b !== d) && c >= a && d <= b) {
      const dropped = [c > a ? `bỏ ${c - a === 1 ? `chỉ số ${a}` : `các chỉ số ${a}..${c - 1}`} bên trái` : '', d < b ? `bỏ ${b - d === 1 ? `chỉ số ${b}` : `các chỉ số ${d + 1}..${b}`} bên phải` : ''].filter(Boolean).join(', ');
      out.push(d < c
        ? `Vùng đang xét [${a}..${b}] đã rỗng sau dòng này (${range.from} > ${range.to}).`
        : `Vùng đang xét thu hẹp từ [${a}..${b}] (${b - a + 1} phần tử) xuống [${c}..${d}] (${d - c + 1} phần tử): ${dropped}.`);
    }
  }

  if (algorithm?.id === 'binary-search') {
    const arrayName = /(\w+)\s*\[\s*mid\s*\]/.exec(text)?.[1];
    const target = /\[\s*mid\s*\]\s*(?:==|<=?|>=?)\s*(\w+)/.exec(text)?.[1];
    if (/^(?:[\w:<>]+\s+)?mid\s*=/.test(source) && after && isInt(after.mid) && range && arrayName) {
      const l = vars[range.from], r = vars[range.to];
      out.push(`Chọn phần tử ở giữa vùng [${l}..${r}]: mid = ${after.mid}, ${arrayName}[${after.mid}] = ${show(cell(vars, arrayName, [after.mid]))}. So sánh nó với ${target ?? 'giá trị cần tìm'} sẽ loại được một nửa vùng.`);
    }
    const compare = cond && /^(\w+)\s*\[\s*mid\s*\]\s*(==|<|>)\s*(\w+)$/.exec(cond);
    if (compare && focus.outcome && isInt(vars.mid)) {
      const [, arr, op, t] = compare;
      const v = cell(vars, arr, [vars.mid]), goal = vars[t];
      if (typeof v === 'number' && typeof goal === 'number') {
        const left = range?.from ?? 'left', right = range?.to ?? 'right';
        if (op === '==') out.push(focus.outcome.taken ? `${arr}[mid] = ${v} đúng bằng ${t} ⇒ đã tìm thấy ở chỉ số ${vars.mid}, không cần xét thêm.` : `${v} ≠ ${goal} nên chưa tìm thấy; còn phải quyết định bỏ nửa nào.`);
        else if (v < goal) out.push(`${v} < ${goal}: mảng tăng dần nên mọi phần tử từ ${left} tới mid đều nhỏ hơn ${t} ⇒ ${t} chỉ có thể nằm bên phải mid.`);
        else if (v > goal) out.push(`${v} > ${goal}: mảng tăng dần nên mọi phần tử từ mid tới ${right} đều lớn hơn ${t} ⇒ ${t} chỉ có thể nằm bên trái mid.`);
      }
    }
    if (focus.kind === 'while' && focus.outcome && range) {
      const l = vars[range.from], r = vars[range.to];
      if (isInt(l) && isInt(r)) out.push(focus.outcome.taken ? `Vùng tìm [${l}..${r}] còn ${r - l + 1} phần tử nên tìm tiếp.` : `${range.from} > ${range.to} nghĩa là vùng tìm đã rỗng ⇒ ${target ?? 'giá trị cần tìm'} không có trong mảng.`);
    }
  }
  if (algorithm?.id === 'two-pointers' && focus.kind === 'while' && focus.outcome && range) {
    const l = vars[range.from], r = vars[range.to];
    if (isInt(l) && isInt(r)) out.push(focus.outcome.taken
      ? `${range.from} = ${l} vẫn ở bên trái ${range.to} = ${r} ⇒ còn cặp ở hai đầu chưa xét.`
      : `Hai con trỏ đã gặp nhau (${range.from} = ${l}, ${range.to} = ${r}) ⇒ mọi cặp đã được xét.`);
  }

  // Two cells of one array compared against each other.
  if ((focus.kind === 'if' || focus.kind === 'while') && focus.outcome && reads.length === 2 && reads[0].array === reads[1].array && reads.every(r => r.indices.length === 1)) {
    const [p, q] = reads, op = cond && /\]\s*(>=|<=|==|!=|>|<)\s*\w+\s*\[/.exec(cond)?.[1];
    const [i, j] = [p.indices[0], q.indices[0]];
    if (j === i + 1 && (op === '>' || op === '<')) {
      const word = op === '>' ? 'tăng dần' : 'giảm dần';
      out.push(focus.outcome.taken
        ? `Phần tử đứng trước (${show(p.value)}) ${op === '>' ? 'lớn' : 'nhỏ'} hơn phần tử đứng sau (${show(q.value)}) ⇒ sai thứ tự ${word} ⇒ cần đổi chỗ.`
        : `${show(p.value)} và ${show(q.value)} đã đúng thứ tự ${word} ⇒ giữ nguyên.`);
    } else if (range && i === vars[range.from] && j === vars[range.to] && (op === '==' || op === '!=')) {
      out.push(same(p.value, q.value)
        ? `Hai đầu của vùng giống nhau (${show(p.value)} = ${show(q.value)}) ⇒ cặp này khớp, hai con trỏ sẽ tiến vào trong.`
        : `Hai đầu của vùng khác nhau (${show(p.value)} ≠ ${show(q.value)}) ⇒ đã tìm ra cặp không khớp.`);
    }
  }

  // The three steps of swapping through a temporary.
  const tempStore = /^(?:[\w:]+\s+)?(temp|tmp|t)\s*=\s*\w+\s*\[/.exec(source);
  const followingLine = stripComment(code.split(/\r?\n/)[event.line] ?? '');
  if (tempStore && reads.length === 1)
    out.push(`Bước 1/3 của phép đổi chỗ: cất ${reads[0].text} = ${show(reads[0].value)} vào ${tempStore[1]}, vì dòng sau sẽ ghi đè lên ô này.`);
  else if (focus.kind === 'assign' && writes.length === 1 && reads.length === 1 && new RegExp(`=\\s*(?:temp|tmp|t)\\s*;`).test(followingLine))
    out.push(`Bước 2/3: chép ${reads[0].text} = ${show(reads[0].value)} sang ${writes[0].text}. Giá trị cũ của ${writes[0].text} vẫn được giữ trong biến tạm.`);
  else if (focus.kind === 'assign' && writes.length === 1) {
    const tmp = /=\s*(temp|tmp|t)$/.exec(source)?.[1];
    if (tmp) out.push(`Bước 3/3: đặt giá trị đã cất trong ${tmp} (${show(vars[tmp])}) vào ${writes[0].text} ⇒ hai ô đã đổi chỗ xong.`);
  }
  if (focus.kind === 'swap' && after && writes.length === 2 && writes[0].array === writes[1].array) {
    const [p, q] = writes;
    const x = cell(after, p.array, p.indices), y = cell(after, q.array, q.indices);
    if (same(x, q.value) && same(y, p.value)) out.push(`Sau khi đổi: ${p.array}[${p.indices[0]}] = ${show(x)}, ${q.array}[${q.indices[0]}] = ${show(y)}.${algorithm?.id === 'bubble-sort' ? ' Số lớn hơn được đẩy dần về cuối mảng.' : ''}`);
  }

  // Running total: verify it really is the sum of the prefix before saying so.
  const acc = /^(\w+)\s*\+=\s*(\w+)\s*\[\s*(\w+)\s*\]$/.exec(source);
  if (acc && after) {
    const [, total, arr, idx] = acc;
    const items = indexable(vars[arr]), i = vars[idx], now = after[total];
    if (items && isInt(i) && typeof now === 'number' && items.slice(0, i + 1).every(v => typeof v === 'number')) {
      const prefix = items.slice(0, i + 1) as number[];
      if (prefix.reduce((s, v) => s + v, 0) === now) {
        const terms = prefix.length > 6 ? `${prefix.slice(0, 3).join(' + ')} + … + ${prefix[prefix.length - 1]}` : prefix.join(' + ');
        out.push(`Bây giờ ${total} = ${terms} = ${now}: tổng của ${i + 1} phần tử đầu tiên (${arr}[0..${i}]).`);
      }
    }
  }

  // Best-so-far comparisons: the current best must really be the best of the prefix.
  const best = cond && /^(\w+)\s*\[\s*(\w+)\s*\]\s*([<>])=?\s*(\w+)$/.exec(cond);
  if (best && focus.outcome && !(best[4] in vars && Array.isArray(vars[best[4]]))) {
    const [, arr, idx, op, name] = best;
    const items = indexable(vars[arr]), i = vars[idx], current = vars[name];
    if (items && isInt(i) && i > 0 && typeof current === 'number' && items.slice(0, i + 1).every(v => typeof v === 'number')) {
      const seen = items.slice(0, i) as number[];
      const word = op === '>' ? 'lớn' : 'nhỏ';
      if (current === (op === '>' ? Math.max(...seen) : Math.min(...seen)))
        out.push(`${name} = ${current} đang là số ${word} nhất trong ${arr}[0..${i - 1}]. ${focus.outcome.taken ? `${arr}[${i}] = ${items[i]} ${word} hơn nên sẽ trở thành ${name} mới.` : `${arr}[${i}] = ${items[i]} không ${word} hơn nên ${name} giữ nguyên.`}`);
    }
  }

  // Recursion: base case, waiting for a deeper call, handing a result back.
  const recursive = recursiveFunctions(code);
  if (focus.kind === 'if' && focus.outcome && frame && recursive.has(frame.func)) {
    const body = controlledRange(code, event.line);
    const lines = body ? clean(code).split('\n').slice(body.bodyStart - 1, body.end).join(' ') : '';
    if (/\breturn\b/.test(lines) && !new RegExp(`\\b${frame.func}\\s*\\(`).test(lines))
      out.push(focus.outcome.taken
        ? `Đây là trường hợp cơ sở: ${call(frame)} trả kết quả ngay mà không gọi đệ quy, các lời gọi đang chờ sẽ lần lượt được tính tiếp.`
        : `Chưa tới trường hợp cơ sở nên ${call(frame)} phải gọi lại chính nó với bài toán nhỏ hơn.`);
  }
  if (next && next.callStack.length > event.callStack.length) {
    const callee = next.callStack[next.callStack.length - 1];
    if (recursive.has(callee.func))
      out.push(`${call(frame)} tạm dừng ở dòng này để chờ ${call(callee)} trả kết quả. Ngăn xếp sẽ có ${next.callStack.length} lời gọi.`);
  }

  // DP: which solved subproblems a cell is built from.
  if ((focus.kind === 'assign' || focus.kind === 'declare') && writes.length === 1 && (algorithm?.id === 'dp' || /^dp/i.test(writes[0].array))) {
    const w = writes[0];
    const deps = reads.filter(r => r.array === w.array && r.indices.length === w.indices.length);
    const where = (r: typeof w) => {
      const d = r.indices.map((x, k) => x - w.indices[k]);
      if (d.length === 2) return ({ '-1,0': 'ô phía trên', '0,-1': 'ô bên trái', '-1,-1': 'ô chéo trên-trái', '-1,1': 'ô chéo trên-phải' } as Record<string, string>)[d.join(',')] ?? 'ô đã tính';
      return d[0] === -1 ? 'ô ngay trước' : d[0] < 0 ? `${-d[0]} ô trước` : 'ô khác';
    };
    const name = `${w.array}[${w.indices.join('][')}]`;
    if (deps.length && deps.length === reads.length)
      out.push(`${name} được tính từ bài toán con đã giải: ${deps.map(r => `${r.array}[${r.indices.join('][')}] = ${show(r.value)} (${where(r)})`).join(' và ')}.`);
    else if (!reads.length && algorithm?.id === 'dp' && /=\s*-?\d+$/.test(source))
      out.push(`Trường hợp cơ sở: ${name} được gán sẵn giá trị, không phụ thuộc ô nào khác.`);
  }

  if (source === 'break') out.push('Đã có kết quả nên dừng vòng lặp sớm, không xét các phần tử còn lại.');
  return [...new Set(out)].slice(0, 3);
}
