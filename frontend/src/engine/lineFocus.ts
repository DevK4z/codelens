import type { TraceEvent } from './types.ts';
import { sameCallContext, formatObserved } from './stepState.ts';

// Explains the highlighted line with the values a debugger observed just before it ran.
// Values are only substituted, never computed through user code: indices and pure number
// expressions are evaluated with C++ integer rules, and branch outcomes come from where the
// next recorded step actually went, not from guessing at the condition.

export interface ArrayRef { array: string; text: string; indices: number[]; value: unknown; inRange: boolean; access: 'read' | 'write' }
export type FocusKind = 'if' | 'while' | 'for' | 'foreach' | 'assign' | 'declare' | 'swap' | 'output' | 'input' | 'return' | 'other';
export interface LineFocus {
  kind: FocusKind;
  summary: string;
  steps: string[];
  outcome?: { taken: boolean; text: string };
  after: string[];
  refs: ArrayRef[];
}

const KEYWORDS = new Set(['if', 'else', 'for', 'while', 'do', 'return', 'int', 'long', 'short', 'double', 'float', 'char', 'bool', 'auto',
  'unsigned', 'signed', 'const', 'void', 'true', 'false', 'std', 'cout', 'cin', 'endl', 'using', 'namespace', 'sizeof', 'break', 'continue',
  'string', 'vector', 'size_t', 'nullptr', 'new', 'delete', 'struct', 'class', 'static', 'swap']);

const isScalar = (v: unknown) => typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length === 1);
const show = (v: unknown) => typeof v === 'string' ? (v.length === 1 ? `'${v}'` : JSON.stringify(v)) : formatObserved(v);

export function stripComment(line: string): string {
  return line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').trim();
}

// A string indexed like s[i] is a char array for teaching purposes.
export function indexable(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 1 && value.length <= 100 && value !== '<unavailable>') return Array.from(value);
  return undefined;
}

// ---- Number expressions (only literals and operators, C++ int semantics) ----
type Num = { n: number; int: boolean } | { b: boolean };
const asNum = (v: Num) => 'b' in v ? { n: v.b ? 1 : 0, int: true } : v;
const asBool = (v: Num) => 'b' in v ? v.b : v.n !== 0;

export function evaluate(expr: string): number | boolean | undefined {
  const tokens = expr.match(/'(?:\\.|[^'\\])'|\d+\.\d+|\d+|true|false|&&|\|\||==|!=|<=|>=|[-+*/%<>!()]|\S/g) ?? [];
  let pos = 0;
  const peek = () => tokens[pos];
  const fail = () => { throw new Error('not a number expression'); };
  const intOk = (n: number) => Number.isFinite(n) && Math.abs(n) <= 2147483647;
  const binary = (ops: string[], next: () => Num, apply: (op: string, a: Num, b: Num) => Num) => () => {
    let left = next();
    while (ops.includes(peek())) { const op = tokens[pos++]; left = apply(op, left, next()); }
    return left;
  };
  const primary = (): Num => {
    const t = tokens[pos++];
    if (t === undefined) fail();
    if (t === '(') { const v = or(); if (tokens[pos++] !== ')') fail(); return v; }
    if (t === 'true' || t === 'false') return { b: t === 'true' };
    if (t === '!') return { b: !asBool(primary()) };
    if (t === '-') { const v = asNum(primary()); return { n: -v.n, int: v.int }; }
    // A plain char literal compares by its character code, as in C++.
    if (/^'[^'\\]'$/.test(t)) return { n: t.charCodeAt(1), int: true };
    if (/^\d+$/.test(t)) return { n: Number(t), int: true };
    if (/^\d+\.\d+$/.test(t)) return { n: Number(t), int: false };
    return fail();
  };
  const mul = binary(['*', '/', '%'], primary, (op, a, b) => {
    const x = asNum(a), y = asNum(b), int = x.int && y.int;
    if (op !== '*' && y.n === 0) fail();
    if (op === '%' && !int) fail();
    const n = op === '*' ? x.n * y.n : op === '/' ? (int ? Math.trunc(x.n / y.n) : x.n / y.n) : x.n % y.n;
    if (int && !intOk(n)) fail();
    return { n, int };
  });
  const add = binary(['+', '-'], mul, (op, a, b) => {
    const x = asNum(a), y = asNum(b), int = x.int && y.int, n = op === '+' ? x.n + y.n : x.n - y.n;
    if (int && !intOk(n)) fail();
    return { n, int };
  });
  const rel = binary(['<', '<=', '>', '>='], add, (op, a, b) => {
    const x = asNum(a).n, y = asNum(b).n;
    return { b: op === '<' ? x < y : op === '<=' ? x <= y : op === '>' ? x > y : x >= y };
  });
  const eq = binary(['==', '!='], rel, (op, a, b) => ({ b: (asNum(a).n === asNum(b).n) === (op === '==') }));
  const and = binary(['&&'], eq, (_op, a, b) => ({ b: asBool(a) && asBool(b) }));
  const or = binary(['||'], and, (_op, a, b) => ({ b: asBool(a) || asBool(b) }));
  try {
    const v = or();
    if (pos !== tokens.length) return undefined;
    return 'b' in v ? v.b : v.n;
  } catch { return undefined; }
}

// ---- Substitution ----
// Splits the text after `name` into its bracket groups: "[i][j+1]" -> ["i", "j+1"].
function brackets(text: string, start: number): { parts: string[]; end: number } | undefined {
  const parts: string[] = [];
  let i = start;
  while (true) {
    let j = i;
    while (text[j] === ' ') j++;
    if (text[j] !== '[') break;
    let depth = 0, k = j;
    for (; k < text.length; k++) {
      if (text[k] === '[') depth++;
      else if (text[k] === ']' && --depth === 0) break;
    }
    if (k >= text.length) return undefined;
    parts.push(text.slice(j + 1, k));
    i = k + 1;
  }
  return parts.length ? { parts, end: i } : undefined;
}

function replaceScalars(expr: string, vars: Record<string, unknown>): string {
  return expr.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\.|->|::)?\b([A-Za-z_]\w*)\b(\s*\()?/g, (whole, literal, member, name, call) => {
    if (literal || member || call || KEYWORDS.has(name) || !Object.prototype.hasOwnProperty.call(vars, name)) return whole;
    const v = vars[name];
    return isScalar(v) ? show(v) : whole;
  });
}

interface Substituted { indexed: string; valued: string; refs: ArrayRef[] }

function substitute(expr: string, vars: Record<string, unknown>, access: 'read' | 'write' = 'read'): Substituted {
  const refs: ArrayRef[] = [];
  let indexed = '', valued = '', last = 0;
  const pattern = /(\.|->)?\b([A-Za-z_]\w*)\s*\[/g;
  for (let m: RegExpExecArray | null; (m = pattern.exec(expr));) {
    const name = m[2];
    const group = brackets(expr, m.index + m[0].length - 1);
    if (m[1] || !group || !indexable(vars[name])) continue;
    const indices = group.parts.map(part => {
      const inner = substitute(part, vars).valued;
      const v = evaluate(inner);
      return typeof v === 'number' && Number.isInteger(v) ? v : undefined;
    });
    if (indices.some(i => i === undefined)) continue;
    let value: unknown = vars[name], inRange = true;
    for (const i of indices as number[]) {
      const items = indexable(value);
      if (!items || i < 0 || i >= items.length) { inRange = false; value = undefined; break; }
      value = items[i];
    }
    const before = expr.slice(last, m.index);
    const text = expr.slice(m.index, group.end).replace(/\s+/g, '');
    const literal = `${name}${(indices as number[]).map(i => `[${i}]`).join('')}`;
    refs.push({ array: name, text, indices: indices as number[], value, inRange, access });
    indexed += before + literal;
    valued += replaceScalars(before, vars) + (inRange && isScalar(value) ? show(value) : literal);
    last = group.end;
    pattern.lastIndex = group.end;
  }
  indexed += expr.slice(last);
  valued += replaceScalars(expr.slice(last), vars);
  return { indexed, valued, refs };
}

// original -> indices filled in -> values filled in -> number result, skipping repeats.
function chain(expr: string, s: Substituted, evaluateIt: boolean): string[] {
  const steps = [expr.trim()];
  for (const next of [s.indexed.trim(), s.valued.trim()]) if (next && next !== steps[steps.length - 1]) steps.push(next);
  if (evaluateIt) {
    const v = evaluate(s.valued);
    const text = v === undefined ? undefined : typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v);
    if (text !== undefined && text !== steps[steps.length - 1]) steps.push(text);
  }
  return steps;
}

// ---- Source structure ----
// Text from the start of `line` (1-based) to the end of the program, with offsets mapped back to lines.
function lineAt(lines: string[], offset: number, first: number): number {
  let total = 0;
  for (let i = first - 1; i < lines.length; i++) {
    total += lines[i].length + 1;
    if (offset < total) return i + 1;
  }
  return lines.length;
}

function cleanSource(lines: string[]): string[] {
  return lines.map(l => l.replace(/\/\/.*$/, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, m => ' '.repeat(m.length)));
}

// Last line of the statement controlled by the if/for/while header on `line`, and whether it has an else.
export function controlledRange(code: string, line: number): { bodyStart: number; end: number; hasElse: boolean } | undefined {
  const lines = cleanSource(code.split(/\r?\n/));
  const text = lines.slice(line - 1).join('\n');
  const open = text.indexOf('(');
  if (open < 0) return undefined;
  let depth = 0, i = open;
  for (; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) break;
  }
  if (i >= text.length) return undefined;
  const statementEnd = (from: number): number | undefined => {
    let j = from;
    while (/\s/.test(text[j] ?? '')) j++;
    if (text[j] === undefined) return undefined;
    if (text[j] === '{') {
      let d = 0;
      for (; j < text.length; j++) {
        if (text[j] === '{') d++;
        else if (text[j] === '}' && --d === 0) return j;
      }
      return undefined;
    }
    const nested = /^(if|for|while)\s*\(/.exec(text.slice(j));
    if (nested) {
      let d = 0, k = j + nested[0].length - 1;
      for (; k < text.length; k++) {
        if (text[k] === '(') d++;
        else if (text[k] === ')' && --d === 0) break;
      }
      return statementEnd(k + 1);
    }
    let d = 0;
    for (; j < text.length; j++) {
      if (text[j] === '(' || text[j] === '{') d++;
      else if (text[j] === ')' || text[j] === '}') d--;
      else if (text[j] === ';' && d <= 0) return j;
    }
    return undefined;
  };
  // First character of the body's first statement, past an opening brace.
  let bodyFrom = i + 1;
  while (/\s/.test(text[bodyFrom] ?? '')) bodyFrom++;
  if (text[bodyFrom] === '{') do bodyFrom++; while (/\s/.test(text[bodyFrom] ?? ''));
  const end = statementEnd(i + 1);
  if (end === undefined) return undefined;
  return {
    bodyStart: lineAt(lines, bodyFrom, line),
    end: lineAt(lines, end, line),
    hasElse: /^\s*else\b/.test(text.slice(end + 1)),
  };
}

function topLevelAssignment(text: string): { lhs: string; op: string; rhs: string } | undefined {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === '=' && depth === 0 && text[i + 1] !== '=' && !'=!<>'.includes(text[i - 1] ?? '')) {
      const prev = text[i - 1] ?? '';
      const compound = '+-*/%&|^'.includes(prev) && prev !== '';
      return { lhs: text.slice(0, compound ? i - 1 : i).trim(), op: compound ? prev + '=' : '=', rhs: text.slice(i + 1).trim() };
    }
  }
  return undefined;
}

const BUILT_IN_TYPES = String.raw`long\s+long|long|int|short|double|float|char|bool|auto|void|size_t|(?:std::)?string|(?:std::)?\w+\s*<.*>`;

// Names the program defines for types: typedef long long ll, using ll = ..., #define ll ..., struct Node.
export function definedTypes(code: string): string[] {
  const names = [
    ...code.matchAll(/\btypedef\b[^;]*?\b(\w+)\s*;/g), ...code.matchAll(/\busing\s+(\w+)\s*=/g),
    ...code.matchAll(/^\s*#\s*define\s+(\w+)\s+(?:unsigned|signed|long|int|short|double|float|char|bool|string|vector|pair|map|set|std)\b/gm),
    ...code.matchAll(/\b(?:struct|class)\s+(\w+)/g),
  ].map(m => m[1]);
  return [...new Set(names)];
}

function declarationPattern(code: string): RegExp {
  const types = [BUILT_IN_TYPES, ...definedTypes(code)].join('|');
  return new RegExp(String.raw`^(?:static\s+|inline\s+|constexpr\s+)*(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:${types})(?:\s+const)?(?:\s+|\s*[&*]+\s*|(?<=>))([A-Za-z_~][\w:~]*)\s*(.*)$`);
}

// Names of constants defined at file scope, which never change and say nothing about a step.
export function globalConstants(code: string): Set<string> {
  const names = new Set<string>();
  let depth = 0;
  for (const raw of code.split(/\r?\n/)) {
    const line = stripComment(raw);
    if (depth === 0 && /^(?:static\s+)?(?:const|constexpr)\b/.test(line)) {
      const declared = /^(?:static\s+)?(?:const|constexpr)\s+(?:const\s+)?[\w:<>]+(?:\s+[\w:<>]+)*?\s+(.+?);?$/.exec(line)?.[1] ?? '';
      for (const part of splitArgs(declared)) { const name = /^[*&\s]*([A-Za-z_]\w*)/.exec(part)?.[1]; if (name) names.add(name); }
    }
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
  }
  return names;
}
const OPERATION: Record<string, (lhs: string, rhs: string) => string> = {
  '+=': (l, r) => `Cộng thêm ${r} vào ${l}`, '-=': (l, r) => `Trừ bớt ${r} khỏi ${l}`, '*=': (l, r) => `Nhân ${l} với ${r}`,
  '/=': (l, r) => `Chia ${l} cho ${r}`, '%=': (l, r) => `Lấy ${l} chia ${r} lấy dư`,
};

function observedChanges(event: TraceEvent, next: TraceEvent): string[] {
  const changes: string[] = [];
  for (const [name, value] of Object.entries(next.variables)) {
    if (!Object.prototype.hasOwnProperty.call(event.variables, name)) continue;
    const old = event.variables[name];
    if (JSON.stringify(old) === JSON.stringify(value)) continue;
    const a = indexable(old), b = indexable(value);
    // A variable whose scope ended (a for-loop counter after the loop) reads as null; that is not a change.
    if (value === null) continue;
    if (a && b && Array.isArray(old) === Array.isArray(value)) {
      if (a.length !== b.length) changes.push(`${name}: ${a.length} → ${b.length} phần tử`);
      for (let i = 0; i < Math.min(a.length, b.length) && changes.length < 6; i++) {
        if (JSON.stringify(a[i]) === JSON.stringify(b[i])) continue;
        const rowA = a[i], rowB = b[i];
        if (Array.isArray(rowA) && Array.isArray(rowB) && rowA.length === rowB.length) {
          rowA.forEach((cell, j) => { if (JSON.stringify(cell) !== JSON.stringify(rowB[j])) changes.push(`${name}[${i}][${j}]: ${show(cell)} → ${show(rowB[j])}`); });
        } else changes.push(`${name}[${i}]: ${show(rowA)} → ${show(rowB)}`);
      }
    } else changes.push(old === null ? `${name} = ${show(value)}` : `${name}: ${show(old)} → ${show(value)}`);
    if (changes.length >= 6) break;
  }
  const out = next.stdout ?? '', before = event.stdout ?? '';
  if (out !== before && out.startsWith(before)) changes.push(`In ra: ${JSON.stringify(out.slice(before.length))}`);
  return changes;
}

export function lineFocus(event: TraceEvent, next: TraceEvent | null | undefined, code: string): LineFocus | undefined {
  if (event.event === 'stdout' && !event.callStack.length) return undefined;
  const raw = code.split(/\r?\n/)[event.line - 1];
  if (raw === undefined) return undefined;
  const source = stripComment(raw).replace(/^\}\s*/, '').replace(/[;{]\s*$/, '').trim();
  if (!source || source === '}') return undefined;
  const vars = event.variables;
  const sameFrame = !!next && sameCallContext(next, event);
  const after = sameFrame ? observedChanges(event, next!) : [];
  if (next && !sameFrame && next.callStack.length > event.callStack.length)
    after.push(`Dòng này gọi hàm ${next.callStack[next.callStack.length - 1]?.func ?? ''}: bước tiếp theo đi vào bên trong hàm đó.`);
  else if (next && !sameFrame && next.callStack.length < event.callStack.length && next.callStack.length)
    after.push('Hàm hiện tại kết thúc, quay lại nơi đã gọi nó.');

  const branch = (kind: 'if' | 'while' | 'for' | 'foreach', yes: string, no: string) => {
    const range = controlledRange(code, event.line);
    if (!range || !sameFrame || range.bodyStart <= event.line) return undefined;
    const taken = next!.line > event.line && next!.line <= range.end;
    return { taken, text: taken ? yes : (kind === 'if' && range.hasElse ? `${no}, chuyển sang else` : no) };
  };

  let m: RegExpExecArray | null;
  let h: { inner: string; rest: string } | undefined;
  if (source === 'else') return { kind: 'other', summary: 'Nhánh else: chỉ chạy khi điều kiện if phía trên sai', steps: [], after, refs: [] };
  if (source === 'break') return { kind: 'other', summary: 'break: thoát ngay khỏi vòng lặp gần nhất', steps: [], after, refs: [] };
  if (source === 'continue') return { kind: 'other', summary: 'continue: bỏ qua phần còn lại, sang vòng lặp tiếp theo', steps: [], after, refs: [] };
  if ((h = header(source, /^(?:else\s+)?if\s*\(/))) {
    const cond = h.inner;
    const s = substitute(cond, vars);
    const outcome = branch('if', 'ĐÚNG → chạy các lệnh bên trong if', 'SAI → bỏ qua các lệnh bên trong if');
    const steps = chain(cond, s, true);
    const evaluated = evaluate(s.valued);
    // A condition with side effects can disagree with the observed branch; trust the observation.
    if (outcome && typeof evaluated === 'boolean' && evaluated !== outcome.taken) steps.pop();
    return { kind: 'if', summary: `Kiểm tra điều kiện ${cond.trim()}`, steps, outcome, after: outcome ? [] : after, refs: s.refs };
  }
  if ((h = header(source, /^while\s*\(/)) && !h.rest) {
    const cond = h.inner;
    const s = substitute(cond, vars);
    const outcome = branch('while', 'ĐÚNG → chạy thêm một vòng lặp', 'SAI → thoát khỏi vòng lặp');
    const steps = chain(cond, s, true);
    const evaluated = evaluate(s.valued);
    if (outcome && typeof evaluated === 'boolean' && evaluated !== outcome.taken) steps.pop();
    return { kind: 'while', summary: `Vòng lặp while: lặp tiếp khi ${cond.trim()}`, steps, outcome, after: [], refs: s.refs };
  }
  if ((h = header(source, /^for\s*\(/))) {
    const loop = h.inner;
    const each = /^(?:const\s+)?[\w:<>\s]+?[&\s]+([A-Za-z_]\w*)\s*:\s*(.+)$/.exec(loop);
    if (each) {
      const outcome = branch('foreach', `Lấy phần tử tiếp theo của ${each[2].trim()} vào ${each[1]}`, `Đã duyệt hết ${each[2].trim()} → thoát vòng lặp`);
      return { kind: 'foreach', summary: `Duyệt lần lượt từng phần tử của ${each[2].trim()}, mỗi lần gán vào ${each[1]}`, steps: [], outcome, after, refs: [] };
    }
    const [init = '', cond = '', step = ''] = loop.split(';').map(p => p.trim());
    // At this stop the loop variable has not been incremented yet, so the condition is not evaluated here.
    const outcome = branch('for', 'Điều kiện còn đúng → chạy thêm một vòng', 'Điều kiện đã sai → thoát khỏi vòng lặp');
    const parts = [init && `khởi tạo ${init}`, cond && `lặp khi ${cond}`, step && `sau mỗi vòng: ${step}`].filter(Boolean);
    return { kind: 'for', summary: `Vòng lặp for: ${parts.join(', ')}`, steps: [], outcome, after, refs: [] };
  }
  if ((h = header(source, /^(?:std::)?swap\s*\(/)) && !h.rest) {
    const [a = '', b = ''] = splitArgs(h.inner);
    const sa = substitute(a, vars, 'write'), sb = substitute(b, vars, 'write');
    const values = [sa, sb].map(x => x.valued.trim());
    return { kind: 'swap', summary: `Đổi chỗ ${a.trim()} và ${b.trim()}`, steps: [`${a.trim()} ⇄ ${b.trim()}`, `${values[0]} ⇄ ${values[1]}`].filter((x, i, all) => i === 0 || x !== all[i - 1]), after, refs: [...sa.refs, ...sb.refs] };
  }
  if ((m = /^(?:std::)?cout\s*<<\s*(.*)$/.exec(source))) {
    const items = m[1].split('<<').map(x => x.trim()).filter(x => !/^(?:std::)?endl$/.test(x) && x !== '"\\n"' && x !== "'\\n'");
    const s = substitute(items.join(' , '), vars);
    return { kind: 'output', summary: 'In ra màn hình', steps: chain(items.join(' , '), s, false), after, refs: s.refs };
  }
  if ((m = /^(?:std::)?cin\s*>>\s*(.*)$/.exec(source))) {
    const targets = m[1].split('>>').map(x => x.trim());
    return { kind: 'input', summary: `Đọc dữ liệu từ input vào ${targets.join(', ')}`, steps: [], after, refs: [] };
  }
  if ((m = /^return\b\s*(.*)$/.exec(source))) {
    const expr = m[1];
    if (!expr) return { kind: 'return', summary: 'Kết thúc hàm', steps: [], after, refs: [] };
    const s = substitute(expr, vars);
    return { kind: 'return', summary: `Trả về giá trị của ${expr} cho nơi đã gọi hàm`, steps: chain(expr, s, true), after, refs: s.refs };
  }
  if ((m = /^(?:\+\+\s*([A-Za-z_][\w[\]+\- ]*)|([A-Za-z_][\w[\]+\- ]*?)\s*\+\+)$/.exec(source)) || (m = /^(?:--\s*([A-Za-z_][\w[\]+\- ]*)|([A-Za-z_][\w[\]+\- ]*?)\s*--)$/.exec(source))) {
    const target = (m[1] ?? m[2]).trim();
    const up = source.includes('++');
    const s = substitute(`${target} ${up ? '+' : '-'} 1`, vars);
    const lhs = substitute(target, vars, 'write');
    return { kind: 'assign', summary: `${up ? 'Tăng' : 'Giảm'} ${target} ${up ? 'thêm' : 'bớt'} 1`, steps: chain(`${target} ${up ? '+' : '-'} 1`, s, true), after, refs: [...lhs.refs, ...s.refs.filter(r => r.text !== target)] };
  }
  // Statements that continue the previous line have no meaning of their own to explain.
  const open = (source.match(/\(/g) ?? []).length, close = (source.match(/\)/g) ?? []).length;
  if (/^[:?&|]/.test(source) || (open !== close && !/^(?:else\s+)?(?:if|while)\b/.test(source))) return { kind: 'other', summary: `Phần tiếp theo của câu lệnh ở dòng trên: ${source}`, steps: [], after, refs: substitute(source, vars).refs };
  if (/^(?:else\s+)?(?:if|while)\b/.test(source)) return { kind: 'other', summary: `Kiểm tra điều kiện viết trên nhiều dòng, bắt đầu bằng ${source}`, steps: [], after, refs: [] };
  const definition = /^(?:struct|class)\s+(\w+)/.exec(source);
  if (definition) return { kind: 'other', summary: `Khởi tạo ${definition[1]}`, steps: [], after, refs: [] };
  if (/^[A-Za-z_~][\w:~]*\s*\(.*\)$/.test(source) && !/;\s*$/.test(stripComment(raw)))
    return { kind: 'other', summary: `Bắt đầu hàm ${source.slice(0, source.indexOf('(')).trim()}`, steps: [], after, refs: [] };
  const declaration = declarationPattern(code).exec(source);
  if (declaration) {
    const [, name, rawRest] = declaration;
    const rest = rawRest.trim();
    // A function header ends without ';' (prototypes aside); "vector<int> v(n, 0);" is a declaration.
    if (!/;\s*$/.test(stripComment(raw)) && rest.startsWith('('))
      return { kind: 'other', summary: `Bắt đầu hàm ${name}`, steps: [], after, refs: [] };
    if (rest.startsWith('[')) return { kind: 'declare', summary: `Tạo mảng ${name}${rest.replace(/\s+/g, ' ')}`, steps: [], after, refs: [] };
    if (rest.startsWith(',')) return { kind: 'declare', summary: `Tạo các biến ${name}${rest}`, steps: [], after, refs: [] };
    if (/\bvector\b/.test(source) && rest.startsWith('(')) {
      const [size = '', fill] = splitArgs(rest.slice(1, -1));
      return { kind: 'declare', summary: `Tạo vector ${name} gồm ${size.trim()} phần tử${fill ? `, mỗi phần tử bằng ${fill.trim()}` : ''}`, steps: chain(size, substitute(size, vars), true), after, refs: [] };
    }
    const declarators = splitArgs(`${name} ${rest}`).map(d => d.trim().replace(/\s*=\s*/, ' = '));
    if (declarators.length > 1) return { kind: 'declare', summary: `Tạo các biến ${declarators.join(', ')}`, steps: [], after, refs: [] };
    const init = /^=\s*(.+)$/.exec(rest)?.[1] ?? /^[({](.*)[)}]$/.exec(rest)?.[1];
    if (!init) return { kind: 'declare', summary: `Tạo biến ${name}`, steps: [], after, refs: [] };
    const s = substitute(init, vars);
    return { kind: 'declare', summary: `Tạo biến ${name} và gán giá trị ${init.trim()}`, steps: chain(init, s, true), after, refs: s.refs };
  }
  const assignment = topLevelAssignment(source);
  if (assignment && /^[A-Za-z_*(]/.test(assignment.lhs)) {
    const { lhs, op, rhs } = assignment;
    const target = substitute(lhs, vars, 'write');
    const expr = op === '=' ? rhs : `${lhs} ${op[0]} ${/[-+*/%]/.test(rhs) ? `(${rhs})` : rhs}`;
    const s = substitute(expr, vars);
    const where = target.indexed !== lhs ? ` (tức ${target.indexed})` : '';
    // Nothing to compute in "x = 1" or "x = y": it is a plain copy.
    const plain = /^(?:-?\d+(?:\.\d+)?|true|false|'[^']*'|[A-Za-z_]\w*)$/.test(rhs);
    const summary = op !== '=' ? `${OPERATION[op]?.(lhs, rhs) ?? `Cập nhật ${lhs} với ${rhs}`}${where}`
      : plain ? `Gán ${rhs} vào ${lhs}${where}` : `Tính ${rhs} rồi lưu vào ${lhs}${where}`;
    const reads = s.refs.filter(r => !target.refs.some(t => t.text === r.text));
    return { kind: 'assign', summary, steps: chain(expr, s, true), after, refs: [...target.refs, ...reads] };
  }
  const s = substitute(source, vars);
  return { kind: 'other', summary: statementSummary(source), steps: s.valued !== source ? chain(source, s, false) : [], after, refs: s.refs };
}

const MEMBER_ACTIONS: Record<string, (object: string, args: string) => string> = {
  push_back: (o, a) => `Thêm ${a} vào cuối ${o}`, emplace_back: (o, a) => `Thêm ${a} vào cuối ${o}`, push_front: (o, a) => `Thêm ${a} vào đầu ${o}`,
  push: (o, a) => `Đưa ${a} vào ${o}`, emplace: (o, a) => `Đưa ${a} vào ${o}`, enqueue: (o, a) => `Đưa ${a} vào cuối hàng đợi ${o}`,
  pop_back: o => `Bỏ phần tử cuối của ${o}`, pop_front: o => `Bỏ phần tử đầu của ${o}`, pop: o => `Lấy phần tử tiếp theo ra khỏi ${o}`,
  dequeue: o => `Lấy phần tử đầu ra khỏi hàng đợi ${o}`, clear: o => `Xóa hết phần tử của ${o}`,
  insert: (o, a) => `Chèn ${a} vào ${o}`, erase: (o, a) => `Xóa ${a} khỏi ${o}`,
};

// Plain words for a statement that is a call or a delete.
function statementSummary(source: string): string {
  const removed = /^delete(?:\s*\[\s*\])?\s+(.+)$/.exec(source);
  if (removed) return `Giải phóng vùng nhớ mà ${removed[1]} đang trỏ tới`;
  const member = /^([^()\s]+?)(?:\.|->)(\w+)\s*\((.*)\)$/.exec(source);
  if (member && Object.prototype.hasOwnProperty.call(MEMBER_ACTIONS, member[2])) return MEMBER_ACTIONS[member[2]](member[1], member[3].trim());
  if (member) return `Gọi phương thức ${member[2]} của ${member[1]}${member[3].trim() ? ` với ${member[3].trim()}` : ''}`;
  const algorithm = /^(?:std::)?(sort|stable_sort|reverse)\s*\((.*)\)$/.exec(source);
  if (algorithm) {
    const args = splitArgs(algorithm[2]);
    const target = /^\s*(\w+)\s*\.\s*begin\(\)/.exec(args[0])?.[1] ?? 'đoạn này';
    return algorithm[1] === 'reverse' ? `Đảo ngược ${target}` : `Sắp xếp ${target} ${args.length > 2 ? 'theo tiêu chí được truyền vào' : 'tăng dần'}`;
  }
  const call = /^([A-Za-z_][\w:]*)\s*\((.*)\)$/.exec(source);
  if (call) return `Gọi hàm ${call[1]} với ${call[2].trim() || 'không có tham số'}`;
  return `Tính biểu thức ${source}`;
}

// "if (a[i] > f(x)) y = 1" -> { inner: "a[i] > f(x)", rest: "y = 1" } for the given keyword.
function header(source: string, keyword: RegExp): { inner: string; rest: string } | undefined {
  const m = keyword.exec(source);
  if (!m) return undefined;
  const open = m[0].length - 1;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    // Parentheses inside literals, as in c == '(', are not structure.
    if (source[i] === "'" || source[i] === '"') {
      const quote = source[i];
      for (i++; i < source.length && source[i] !== quote; i++) if (source[i] === '\\') i++;
    } else if (source[i] === '(') depth++;
    else if (source[i] === ')' && --depth === 0) return { inner: source.slice(open + 1, i), rest: source.slice(i + 1).trim() };
  }
  return undefined;
}

function splitArgs(text: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    if ('([{'.includes(text[i])) depth++;
    else if (')]}'.includes(text[i])) depth--;
    else if (text[i] === ',' && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts;
}

const SIZE_LIKE = /^(n|m|N|M|len|length|size|sz|cnt|count)$/;

// Variables the program uses to index `array`, split by dimension: a[i] -> rows [i]; dp[i][j] -> rows [i], cols [j].
export function indexVariables(code: string, array: string): { rows: string[]; cols: string[] } {
  const lines = cleanSource(code.split(/\r?\n/)).join('\n');
  const rows = new Set<string>(), cols = new Set<string>();
  const pattern = new RegExp(`(?<![\\w.>])${array.replace(/[^\w]/g, '')}\\s*\\[`, 'g');
  for (let m: RegExpExecArray | null; (m = pattern.exec(lines));) {
    const group = brackets(lines, m.index + m[0].length - 1);
    if (!group) continue;
    group.parts.slice(0, 2).forEach((part, dim) => {
      const simple = /^\s*([A-Za-z_]\w*)\s*(?:([+-])\s*\d+)?\s*$/.exec(part);
      if (!simple || KEYWORDS.has(simple[1])) return;
      if (simple[2] && SIZE_LIKE.test(simple[1])) return;
      (dim === 0 ? rows : cols).add(simple[1]);
    });
  }
  return { rows: [...rows], cols: [...cols] };
}

const RANGE_PAIRS = [['left', 'right'], ['l', 'r'], ['lo', 'hi'], ['low', 'high'], ['start', 'end'], ['first', 'last'], ['begin', 'end']];

// A pair like left/right marks the part of the array still under consideration.
export function activeRange(vars: Record<string, unknown>, names: string[]): { from: string; to: string } | undefined {
  const byLower = new Map(names.map(n => [n.toLowerCase(), n]));
  for (const [a, b] of RANGE_PAIRS) {
    const from = byLower.get(a), to = byLower.get(b);
    if (from && to && Number.isInteger(vars[from]) && Number.isInteger(vars[to])) return { from, to };
  }
  return undefined;
}
