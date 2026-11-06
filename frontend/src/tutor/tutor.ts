// CodeLens's own DSA tutor. It understands a question with its trained classifier, gathers facts
// from the recorded run and its knowledge base, and writes the answer itself. Nothing leaves the
// browser. In hint mode it asks guiding questions and reveals more on each follow-up.
import type { TraceEvent } from '../engine/types.ts';
import { lineFocus, stripComment } from '../engine/lineFocus.ts';
import { detectAlgorithm, lineInsight, loopContext, recursiveReturns } from '../engine/insight.ts';
import { NaiveBayes, normalize } from './classifier.ts';
import { INTENT_EXAMPLES, type Intent } from './intents.ts';
import { ALGORITHM_CONCEPT, CONCEPTS, conceptById, findConcept, findConcepts, type Concept } from './knowledge.ts';
import { finalOutput, findIssues, loopShape, show, variableHistory } from './analysis.ts';

export type TutorMode = 'hint' | 'explain';

export interface TutorContext {
  code: string;
  trace: TraceEvent[];
  step: number;
  exercise?: { id: string; title: string; statement: string; chapter?: string; proposed_input?: string; proposed_output?: string } | null;
  stdin?: string;
  runtimeError?: string;
  compilationError?: string;
  timeLimitExceeded?: boolean;
  stepLimitExceeded?: boolean;
}

export interface TutorTurn { role: 'user' | 'tutor'; text: string; intent?: Intent; topic?: string; level?: number; mode?: TutorMode }
export interface TutorReply { text: string; intent: Intent | 'unknown'; confidence: number; topic?: string; level: number; mode: TutorMode; suggestions: string[] }

const classifier = new NaiveBayes<Intent>().train(INTENT_EXAMPLES);
// Below this the tutor says it did not understand rather than guess.
const MIN_CONFIDENCE = 0.35;

export const classify = (question: string) => classifier.predict(question);

interface Step {
  event: TraceEvent; next?: TraceEvent; source: string;
  focus: ReturnType<typeof lineFocus>; insights: string[]; loops: string[];
}

function currentStep(ctx: TutorContext): Step | undefined {
  const event = ctx.trace[ctx.step];
  if (!event || (event.event === 'stdout' && !event.callStack.length)) return undefined;
  const next = ctx.trace[ctx.step + 1];
  const focus = lineFocus(event, next, ctx.code);
  const returned = recursiveReturns(ctx.trace, ctx.code).get(ctx.step);
  return {
    event, next, focus,
    source: stripComment(ctx.code.split(/\r?\n/)[event.line - 1] ?? '').trim(),
    insights: lineInsight(event, next, ctx.code, focus, detectAlgorithm(ctx.code), returned),
    loops: loopContext(event, ctx.code),
  };
}

const NO_TRACE = 'Mình chưa có bản ghi chạy từng bước. Hãy chọn chế độ **Trực quan hóa** và nhấn **Chạy**, rồi hỏi lại về bước bạn đang xem.';
const bullets = (items: string[]) => items.map(s => `- ${s}`).join('\n');
const chain = (steps: string[]) => steps.map(s => `\`${s}\``).join(' → ');

// Variables the question names, matched against what exists at this step.
function mentioned(question: string, vars: Record<string, unknown>): string[] {
  const words = new Set(question.match(/[A-Za-z_]\w*/g) ?? []);
  return Object.keys(vars).filter(name => words.has(name));
}

function conceptFor(question: string, ctx: TutorContext): Concept | undefined {
  const algorithm = detectAlgorithm(ctx.code);
  return findConcept(question)
    ?? (ctx.exercise ? findConcept(`${ctx.exercise.title} ${ctx.exercise.statement}`) : undefined)
    ?? conceptById(algorithm && ALGORITHM_CONCEPT[algorithm.id]);
}

function explainConcept(c: Concept, detail: number): string {
  const parts = [`**${c.name}** (${c.chapter}): ${c.idea}`];
  if (c.steps?.length) parts.push(`Các bước:\n${bullets(c.steps)}`);
  if (c.complexity) parts.push(`Độ phức tạp: ${c.complexity}`);
  if (c.pitfalls?.length && detail > 0) parts.push(`Lỗi hay gặp:\n${bullets(c.pitfalls)}`);
  else if (c.pitfalls?.length) parts.push(`Lỗi hay gặp: ${c.pitfalls[0]}`);
  const related = (c.related ?? []).map(id => conceptById(id)?.name).filter(Boolean);
  if (related.length && detail > 0) parts.push(`Liên quan: ${related.join(', ')}.`);
  return parts.join('\n\n');
}

// One guiding question per level; past the last one the hint becomes the explanation.
function ladder(questions: string[], level: number, explain: () => string, lead = ''): { text: string; done: boolean } {
  if (level >= questions.length) return { text: `Bạn đã đi qua các gợi ý rồi, mình giải thích luôn nhé.\n\n${explain()}`, done: true };
  const prefix = level === 0 ? lead : `Gợi ý ${level + 1}/${questions.length}: `;
  return { text: `${prefix}${questions[level]}`, done: false };
}

type Answer = { text: string; topic?: string; done?: boolean };
type Builder = (q: string, ctx: TutorContext, mode: TutorMode, level: number) => Answer;

const describeStep = (s: Step): string => {
  const f = s.focus;
  if (!f) return s.insights.length ? s.insights.join('\n') : `Bước này dừng ở dòng ${s.event.line}.`;
  const parts = [`Dòng ${s.event.line}: \`${s.source}\``, f.summary + '.'];
  if (f.steps.length > 1) parts.push(`Thay giá trị đang có: ${chain(f.steps)}`);
  if (f.outcome) parts.push(`Kết quả: **${f.outcome.text}**.`);
  if (f.after.length) parts.push(`Sau dòng này: ${f.after.join('; ')}.`);
  if (s.insights.length) parts.push(`Vì sao: ${s.insights.join(' ')}`);
  return parts.join('\n');
};

// Guiding questions about the current line, built from its observed values.
function stepQuestions(s: Step): string[] {
  const f = s.focus;
  if (!f) return [];
  const subst = f.steps.length > 1 ? f.steps[f.steps.length > 2 ? f.steps.length - 2 : 1] : undefined;
  switch (f.kind) {
    case 'if': case 'while':
      return [
        `Dòng ${s.event.line} kiểm tra \`${f.steps[0] ?? s.source}\`. Bạn thử thay giá trị các biến đang có vào xem điều kiện đúng hay sai?`,
        subst ? `Thay giá trị vào được \`${subst}\`. Vậy điều kiện đúng hay sai, và chương trình sẽ đi vào nhánh nào?` : 'Nếu điều kiện đúng thì dòng tiếp theo chạy là dòng nào? Nếu sai thì sao?',
      ];
    case 'for': case 'foreach':
      return ['Vòng lặp này bắt đầu từ giá trị nào và dừng khi nào?', s.loops.length ? `Hiện đang ở ${s.loops.join(', ')}. Còn bao nhiêu lần lặp nữa?` : 'Sau mỗi vòng, biến lặp thay đổi thế nào?'];
    case 'swap':
      return [`Dòng này đổi chỗ hai giá trị. Trước khi đổi chúng là \`${f.steps[1] ?? f.steps[0]}\`. Sau khi đổi, hai ô đó sẽ chứa gì?`];
    case 'assign': case 'declare':
      return [
        `Dòng này tính \`${f.steps[0] ?? s.source}\`. Với giá trị hiện tại, biểu thức đó bằng bao nhiêu?`,
        subst ? `Thay giá trị vào được \`${subst}\`. Kết quả là bao nhiêu và được lưu vào đâu?` : 'Kết quả được lưu vào biến nào?',
      ];
    default:
      return [`Hãy đọc dòng \`${s.source}\`: nó thay đổi biến nào, hoặc in ra gì?`];
  }
}

const BUILDERS: Record<Exclude<Intent, 'more' | 'reveal'>, Builder> = {
  greeting: () => ({ text: 'Chào bạn! Mình là trợ lý DSA của CodeLens. Bạn có thể hỏi về bước đang xem ("dòng này làm gì?", "vì sao?"), về giá trị biến, độ phức tạp, lỗi trong code, hoặc một khái niệm như đệ quy, stack, BST.' }),
  capabilities: () => ({
    text: `Mình là trợ lý tự xây của CodeLens, chạy ngay trong trình duyệt và trả lời dựa trên đúng lần chạy của bạn:\n${bullets([
      'Giải thích bước đang xem: dòng này làm gì, vì sao, bước tiếp theo.',
      'Giá trị và lịch sử thay đổi của một biến (ví dụ "i thay đổi thế nào?").',
      'Vòng lặp đang ở lần thứ mấy, độ phức tạp của thuật toán.',
      'Tìm lỗi: truy cập ngoài mảng, tràn số, lặp vô hạn, lỗi biên dịch.',
      'Khái niệm DSA trong học phần: đệ quy, quay lui, quy hoạch động, tham lam, DSLK, stack/queue, cây/BST, các thuật toán sắp xếp, tìm kiếm, bảng băm.',
      'Gợi ý cho bài tập đang mở mà không đưa lời giải.',
    ])}\nChế độ **Gợi mở** sẽ hỏi ngược để bạn tự nghĩ; chế độ **Giải thích thẳng** trả lời đầy đủ.`,
  }),
  thanks: () => ({ text: 'Không có gì! Cứ bấm Bước tiếp và hỏi tiếp nếu có chỗ chưa rõ nhé.' }),

  explain_step: (_q, ctx, mode, level) => {
    const s = currentStep(ctx);
    if (!s) return { text: ctx.trace.length ? 'Bước này là phần đầu ra cuối bản ghi. Lùi lại một bước để xem dòng code cuối cùng.' : NO_TRACE };
    if (mode === 'explain') return { text: describeStep(s), topic: `step:${ctx.step}`, done: true };
    const r = ladder(stepQuestions(s), level, () => describeStep(s));
    return { text: r.text, topic: `step:${ctx.step}`, done: r.done };
  },

  why_step: (q, ctx, mode, level) => {
    const s = currentStep(ctx);
    if (!s) return { text: NO_TRACE };
    const concept = conceptFor(q, ctx);
    const explain = () => s.insights.length
      ? `${s.insights.join('\n')}${concept ? `\n\nÝ tưởng chung (${concept.name}): ${concept.idea}` : ''}`
      : `${describeStep(s)}${concept ? `\n\nTrong ${concept.name}: ${concept.idea}` : ''}`;
    if (mode === 'explain') return { text: explain(), topic: `step:${ctx.step}`, done: true };
    // Questions about this line's values first, then about the algorithm's idea.
    const questions = [...stepQuestions(s), ...(concept?.ask ?? [])];
    const r = ladder(questions, level, explain, 'Mình gợi ý để bạn tự nhận ra nhé. ');
    return { text: r.text, topic: `step:${ctx.step}`, done: r.done };
  },

  next_step: (_q, ctx, mode, level) => {
    const s = currentStep(ctx);
    if (!s) return { text: NO_TRACE };
    if (!s.next) return { text: 'Đây là bước cuối cùng của bản ghi: chương trình đã kết thúc.' };
    const nextSource = stripComment(ctx.code.split(/\r?\n/)[s.next.line - 1] ?? '').trim();
    const deeper = s.next.callStack.length > s.event.callStack.length, shallower = s.next.callStack.length < s.event.callStack.length;
    const explain = () => [
      s.next!.event === 'stdout' && !s.next!.callStack.length ? 'Bước tiếp theo là phần đầu ra cuối cùng của chương trình.'
        : `Bước tiếp theo dừng ở dòng ${s.next!.line}: \`${nextSource}\`${deeper ? ` (đi vào hàm ${s.next!.callStack[s.next!.callStack.length - 1].func})` : shallower ? ' (quay về hàm gọi)' : ''}.`,
      s.focus?.outcome ? `Lý do: ${s.focus.outcome.text}.` : '',
      s.focus?.after.length ? `Giá trị thay đổi: ${s.focus.after.join('; ')}.` : '',
    ].filter(Boolean).join('\n');
    if (mode === 'explain' || !s.focus?.outcome) return { text: explain(), topic: `next:${ctx.step}`, done: true };
    const r = ladder([`Dòng này là \`${s.source}\`. Điều kiện đúng thì chương trình chạy tiếp ở đâu, sai thì ở đâu? Với giá trị hiện tại thì trường hợp nào xảy ra?`], level, explain);
    return { text: r.text, topic: `next:${ctx.step}`, done: r.done };
  },

  variable_value: (q, ctx) => {
    const event = ctx.trace[ctx.step];
    if (!event) return { text: NO_TRACE };
    const vars = event.variables;
    const names = mentioned(q, vars);
    const list = (names.length ? names : Object.keys(vars)).slice(0, 12);
    if (!list.length) return { text: 'Ở bước này chưa có biến nào trong phạm vi hàm hiện tại.' };
    const lines = list.map(n => {
      const v = vars[n], items = Array.isArray(v) ? v : undefined;
      return `\`${n}\` = ${v === null ? 'chưa có giá trị (chưa tới dòng khai báo)' : items ? `[${items.map(show).join(', ')}] (${items.length} phần tử)` : show(v)}`;
    });
    const before = event.detail?.startsWith('GCC/GDB:') ? `Giá trị ngay trước khi dòng ${event.line} chạy` : `Giá trị ở dòng ${event.line}`;
    return { text: `${before}:\n${bullets(lines)}`, done: true };
  },

  variable_history: (q, ctx) => {
    const event = ctx.trace[ctx.step];
    if (!event) return { text: NO_TRACE };
    const frame = event.callStack[event.callStack.length - 1];
    const names = mentioned(q, event.variables);
    const name = names[0] ?? Object.keys(event.variables).find(n => typeof event.variables[n] === 'number');
    if (!name) return { text: 'Bạn muốn xem biến nào? Ví dụ: "i thay đổi thế nào?".' };
    const history = variableHistory(ctx.trace, name, ctx.step);
    const upto = history.filter(c => c.step <= ctx.step), later = history.length - upto.length;
    if (!upto.length) return { text: `\`${name}\` chưa có giá trị tới bước này.` };
    const shown = upto.length > 12 ? [...upto.slice(0, 5), null, ...upto.slice(-6)] : upto;
    const text = shown.map(c => c ? `${show(c.value)} (dòng ${c.line})` : '…').join(' → ');
    const recursive = ctx.trace.some(e => e.callStack.filter(f => f.func === frame?.func).length > 1);
    const where = frame ? `trong lời gọi ${frame.func}${recursive && frame.params ? `(${Object.values(frame.params).map(show).join(', ')})` : ''} hiện tại` : 'ở hàm hiện tại';
    return {
      text: `\`${name}\` ${where} ${upto.length === 1 ? `giữ giá trị ${show(upto[0].value)} từ dòng ${upto[0].line}` : `đã nhận ${upto.length} giá trị tới bước này:\n${text}`}${later ? `\nSau bước này còn đổi thêm ${later} lần nữa.` : '\nTừ đây tới khi lời gọi này kết thúc không đổi nữa.'}${recursive ? '\nMỗi lời gọi đệ quy có bản sao biến riêng, nên đây chỉ là giá trị của lời gọi đang xem.' : ''}`,
      done: true,
    };
  },

  loop_progress: (_q, ctx) => {
    const s = currentStep(ctx);
    if (!s) return { text: NO_TRACE };
    const insight = s.insights.find(i => /Lần lặp thứ|đã chạy đủ/.test(i));
    if (s.loops.length || insight) return { text: [s.loops.length ? `Bước này đang ở ${s.loops.join(', ')}.` : '', insight ?? ''].filter(Boolean).join('\n'), done: true };
    const times = ctx.trace.slice(0, ctx.step + 1).filter(e => e.line === s.event.line).length;
    return { text: `Dòng ${s.event.line} không nằm trong vòng for đếm được (kiểu \`for (int i = a; i < b; i++)\`). Tới bước này dòng đó đã chạy ${times} lần trong bản ghi.`, done: true };
  },

  complexity: (q, ctx, mode, level) => {
    // "độ phức tạp" names the Big-O concept itself; the algorithm in the code is what is asked about.
    const named = findConcept(q);
    const concept = named && named.id !== 'complexity' ? named : conceptFor('', ctx);
    const shape = loopShape(ctx.code);
    const recursive = detectAlgorithm(ctx.code)?.id === 'recursion';
    const reasoning = ctx.code.trim() ? [
      shape.depth >= 2 ? `Code có ${shape.depth} vòng lặp lồng nhau, mỗi vòng chạy cỡ n lần nên thường là O(n${shape.depth === 2 ? "²" : shape.depth === 3 ? "³" : `^${shape.depth}`}).` : shape.depth === 1 ? 'Code có một vòng lặp chạy cỡ n lần nên thường là O(n).' : '',
      shape.halving && !recursive ? 'Có bước chia đôi (mid hoặc /2): nếu mỗi lần vùng xét còn một nửa thì chỉ cần khoảng log₂n lần, tức O(log n).' : '',
      recursive ? 'Code có đệ quy: đếm số lời gọi (vẽ cây đệ quy) rồi nhân với chi phí mỗi lời gọi.' : '',
    ].filter(Boolean) : [];
    const explain = () => [concept?.complexity ? `**${concept.name}**: ${concept.complexity}` : '', ...reasoning].filter(Boolean).join('\n') || 'Mình chưa nhận ra thuật toán. Hãy đếm số lần thao tác chính chạy theo n: một vòng lặp ~ n, hai vòng lồng nhau ~ n², mỗi bước chia đôi ~ log n.';
    if (mode === 'explain') return { text: explain(), topic: 'complexity', done: true };
    const r = ladder(conceptById('complexity')!.ask, level, explain);
    return { text: r.text, topic: 'complexity', done: r.done };
  },

  algorithm_idea: (q, ctx, mode, level) => {
    const algorithm = detectAlgorithm(ctx.code);
    const concept = conceptById(algorithm && ALGORITHM_CONCEPT[algorithm.id]) ?? findConcept(q);
    if (!concept) {
      const shape = loopShape(ctx.code);
      return { text: ctx.code.trim() ? `Mình chưa nhận ra thuật toán quen thuộc nào trong code này. Cấu trúc: ${shape.depth ? `${shape.depth} tầng vòng lặp` : 'không có vòng lặp'}${shape.halving ? ', có bước chia đôi' : ''}. Bạn thử hỏi cụ thể về một bước, hoặc hỏi một khái niệm như "quick sort là gì".` : 'Chưa có code để phân tích.', done: true };
    }
    const explain = () => `${algorithm ? `Code này là **${algorithm.name}**. ` : ''}${explainConcept(concept, 1)}`;
    if (mode === 'explain') return { text: explain(), topic: concept.id, done: true };
    const r = ladder(concept.ask, level, explain, `Code này có dạng ${concept.name}. `);
    return { text: r.text, topic: concept.id, done: r.done };
  },

  concept: (q, ctx, mode, level) => {
    const named = findConcepts(q);
    // "A khác B thế nào": answer both side by side.
    if (named.length >= 2) {
      const [a, b] = named;
      const compare = () => [a, b].map(c => `**${c.name}** (${c.chapter}): ${c.idea}${c.complexity ? `\nĐộ phức tạp: ${c.complexity}` : ''}`).join('\n\n');
      if (mode === 'explain') return { text: compare(), topic: `${a.id}|${b.id}`, done: true };
      const r = ladder([`Thử mô tả một lượt của ${a.name} và một lượt của ${b.name}: mỗi bên làm gì với mảng?`, `${a.ask[0]} Còn với ${b.name}?`], level, compare);
      return { text: r.text, topic: `${a.id}|${b.id}`, done: r.done };
    }
    const concept = named[0] ?? conceptFor(q, ctx);
    if (!concept) return { text: `Mình chưa có kiến thức về chủ đề đó. Các chủ đề mình biết: ${CONCEPTS.map(c => c.name).join(', ')}.` };
    if (mode === 'explain') return { text: explainConcept(concept, level), topic: concept.id, done: true };
    const r = ladder(concept.ask, level, () => explainConcept(concept, 1), `Cùng nghĩ về ${concept.name} nhé: `);
    return { text: r.text, topic: concept.id, done: r.done };
  },

  find_bug: (_q, ctx, mode, level) => {
    const issues = findIssues(ctx.trace, ctx.code, ctx);
    const ex = ctx.exercise;
    const output = finalOutput(ctx.trace).trim();
    const compare = ex?.proposed_output && ctx.trace.length && (ctx.stdin ?? '').trim() === (ex.proposed_input ?? '').trim()
      ? (output === ex.proposed_output.trim() ? `Với input mẫu của bài ${ex.id}, kết quả \`${output}\` khớp đáp án mẫu.` : `Với input mẫu của bài ${ex.id}, chương trình in \`${output || '(trống)'}\` nhưng đáp án mẫu là \`${ex.proposed_output.trim()}\`.`)
      : '';
    if (!issues.length) {
      if (!ctx.trace.length) return { text: 'Hãy chạy chương trình ở chế độ Trực quan hóa để mình kiểm tra bản ghi.' };
      return { text: `Trong bản ghi mình không thấy truy cập ngoài mảng, tràn số hay lặp vô hạn.${compare ? `\n${compare}` : ''}\nNếu kết quả vẫn sai, hãy so từng bước với cách bạn tính bằng tay: bước đầu tiên mà giá trị khác dự đoán thường là chỗ có lỗi.`, done: true };
    }
    const explain = () => `${bullets(issues.map(i => i.text + (i.step >= 0 ? ` (bước ${i.step + 1})` : '')))}${compare ? `\n${compare}` : ''}`;
    if (mode === 'explain') return { text: explain(), topic: 'bug', done: true };
    const first = issues[0];
    const questions = first.kind === 'out_of_range'
      ? [`Hãy xem dòng ${first.line} ở bước ${first.step + 1}. Mảng ở đó có bao nhiêu phần tử, và chỉ số đang dùng là bao nhiêu?`, 'Chỉ số hợp lệ lớn nhất là n - 1. Điều kiện vòng lặp hay biểu thức chỉ số nào để giá trị vượt quá?']
      : first.kind === 'uninitialized' ? [`Hãy xem dòng ${first.line} ở bước ${first.step + 1}: giá trị được đọc ở đó đã được gán ở đâu chưa?`, 'Nếu chưa, biến đó đang chứa gì? Nên khởi tạo nó ở dòng nào?']
      : first.kind === 'endless' ? ['Biến nào quyết định khi nào vòng lặp (hoặc đệ quy) dừng?', 'Sau mỗi vòng, biến đó có tiến gần tới điều kiện dừng không?']
      : first.kind === 'compile' ? [`Trình biên dịch báo lỗi${first.line ? ` ở dòng ${first.line}` : ''}. Bạn đọc dòng đó xem có thiếu dấu ; ngoặc, hay sai tên biến không?`]
      : [`Có dấu hiệu bất thường ở dòng ${first.line}. Bạn xem giá trị các biến ở bước ${first.step + 1} có đúng như dự đoán không?`];
    const r = ladder(questions, level, explain, 'Mình thấy một chỗ đáng ngờ. ');
    return { text: r.text, topic: 'bug', done: r.done };
  },

  output: (_q, ctx) => {
    if (!ctx.trace.length) return { text: NO_TRACE };
    const out = finalOutput(ctx.trace);
    const now = ctx.trace[ctx.step]?.stdout ?? '';
    return { text: `Chương trình in ra:\n\`\`\`\n${out.replace(/\n+$/, '') || '(không in gì)'}\n\`\`\`${now !== out ? `\nTới bước đang xem mới in: \`${now || '(chưa in gì)'}\`.` : ''}`, done: true };
  },

  exercise_help: (q, ctx, mode, level) => {
    const ex = ctx.exercise;
    if (!ex) return BUILDERS.algorithm_idea(q, ctx, mode, level);
    const concept = findConcept(`${ex.title} ${ex.statement}`) ?? CONCEPTS.find(c => c.chapter === ex.chapter);
    const explain = () => `Bài ${ex.id} (${ex.title}) dùng ${concept ? `**${concept.name}**` : 'kiến thức của chương này'}.\n\n${concept ? explainConcept(concept, 1) : ''}\n\nMình không đưa code lời giải; hãy viết thử rồi chạy Trực quan hóa, mình sẽ cùng bạn kiểm tra từng bước.`;
    if (mode === 'explain') return { text: explain(), topic: `ex:${ex.id}`, done: true };
    const questions = [`Đề bài ${ex.id} yêu cầu tính hoặc in ra điều gì? Input và output là gì?`, ...(concept?.ask ?? [])];
    const r = ladder(questions, level, explain, concept ? `Bài này thuộc ${concept.name}. ` : '');
    return { text: r.text, topic: `ex:${ex.id}`, done: r.done };
  },
};

// The previous tutor answer that a follow-up ("chưa hiểu", "nói luôn đi") refers to.
const lastAnswer = (history: TutorTurn[]) => [...history].reverse().find(t => t.role === 'tutor' && t.intent && t.intent !== 'more' && t.intent !== 'reveal');

export function suggestions(ctx: TutorContext, mode: TutorMode, lastDone = true): string[] {
  const list = ctx.trace.length ? ['Dòng này làm gì?', 'Vì sao?', 'Bước tiếp theo?', 'Code có lỗi không?', 'Độ phức tạp?'] : ['Bạn làm được gì?', 'Đệ quy là gì?', 'Độ phức tạp?'];
  if (ctx.exercise) list.splice(1, 0, 'Gợi ý bài này');
  if (mode === 'hint' && !lastDone) list.unshift('Gợi ý thêm', 'Cho mình đáp án');
  return list.slice(0, 6);
}

// The follow-up buttons are commands, not questions to classify.
const COMMANDS: Record<string, Intent> = { 'goi y them': 'more', 'cho minh dap an': 'reveal' };

export function reply(question: string, ctx: TutorContext, mode: TutorMode, history: TutorTurn[] = []): TutorReply {
  const command = COMMANDS[normalize(question)];
  const prediction = command ? { label: command, confidence: 1 } : classify(question);
  let intent = prediction.label;
  let level = 0, useMode = mode;
  // A question that names a concept is about the concept unless it clearly asks something else.
  if ((intent === 'algorithm_idea' || intent === 'why_step') && findConcept(question) && !ctx.trace.length) intent = 'concept';

  if (intent === 'more' || intent === 'reveal') {
    const previous = lastAnswer(history);
    if (!previous?.intent) return { text: 'Bạn muốn mình giải thích thêm về điều gì? Hãy hỏi về bước đang xem, một biến, hoặc một khái niệm.', intent, confidence: prediction.confidence, level: 0, mode, suggestions: suggestions(ctx, mode) };
    const asked = previous.intent as Exclude<Intent, 'more' | 'reveal'>;
    if (intent === 'reveal') useMode = 'explain';
    level = (previous.level ?? 0) + 1;
    const answer = BUILDERS[asked](question, ctx, useMode, level);
    return { ...answer, intent: asked, confidence: prediction.confidence, level, mode: useMode, suggestions: suggestions(ctx, mode, answer.done ?? true) };
  }
  if (prediction.confidence < MIN_CONFIDENCE) {
    return { text: 'Mình chưa chắc hiểu câu hỏi này. Mình trả lời tốt nhất các câu về bước đang xem, giá trị biến, vòng lặp, độ phức tạp, lỗi trong code và các khái niệm DSA của học phần. Bạn thử một trong các gợi ý bên dưới nhé.', intent: 'unknown', confidence: prediction.confidence, level: 0, mode, suggestions: suggestions(ctx, mode) };
  }
  const answer = BUILDERS[intent as Exclude<Intent, 'more' | 'reveal'>](question, ctx, useMode, level);
  return { ...answer, intent, confidence: prediction.confidence, level, mode: useMode, suggestions: suggestions(ctx, mode, answer.done ?? true) };
}
