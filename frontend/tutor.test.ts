import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, reply, type TutorContext, type TutorTurn } from './src/tutor/tutor.ts';
import { findConcept } from './src/tutor/knowledge.ts';
import { findIssues, variableHistory } from './src/tutor/analysis.ts';
import { INTENT_EXAMPLES } from './src/tutor/intents.ts';
import type { TraceEvent } from './src/engine/types.ts';

const at = (line: number, variables: Record<string, unknown>, stack: { func: string; line: number; params?: Record<string, unknown> }[] = [{ func: 'main', line }]): TraceEvent =>
  ({ step: 0, line, event: 'line', callStack: stack.map((f, i) => i === stack.length - 1 ? { ...f, line } : f), variables, changed: [], detail: 'GCC/GDB: before', stdout: '' });

const bubble = `int main() {
  int a[3] = {5, 3, 4};
  for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
      if (a[j] > a[j + 1]) {
        swap(a[j], a[j + 1]);
      }
    }
  }
}`;
const bubbleCtx: TutorContext = { code: bubble, step: 0, trace: [at(5, { a: [5, 3, 4], i: 0, j: 0 }), at(6, { a: [5, 3, 4], i: 0, j: 0 }), at(5, { a: [3, 5, 4], i: 0, j: 1 })] };

test('questions it was never trained on, with or without diacritics, are understood', () => {
  const heldOut: [string, string][] = [
    ['dòng hiện tại có tác dụng gì', 'explain_step'], ['tai sao phai doi cho', 'why_step'], ['sau đây chương trình chạy dòng nào', 'next_step'],
    ['bien j bay gio bang bao nhieu', 'variable_value'], ['left đã thay đổi những giá trị nào', 'variable_history'],
    ['vòng for này còn lặp mấy lần nữa', 'loop_progress'], ['big o cua code', 'complexity'], ['ý tưởng của đoạn code này', 'algorithm_idea'],
    ['hàng đợi là gì', 'concept'], ['code em sai chỗ nào vậy', 'find_bug'], ['kết quả in ra là gì', 'output'],
    ['em chưa biết bắt đầu bài này từ đâu', 'exercise_help'], ['vẫn chưa hiểu lắm', 'more'], ['nói thẳng đáp án đi', 'reveal'],
    ['cam on ban nhieu', 'thanks'], ['xin chao tro ly', 'greeting'],
  ];
  const wrong = heldOut.filter(([q, want]) => classify(q).label !== want);
  assert.ok(wrong.length <= 1, `misclassified: ${wrong.map(([q]) => `${q} → ${classify(q).label}`).join('; ')}`);
  for (const examples of Object.values(INTENT_EXAMPLES)) assert.ok(examples.length >= 8);
});

test('questions outside DSA are declined instead of guessed', () => {
  const r = reply('hôm nay trời mưa không', bubbleCtx, 'explain');
  assert.equal(r.intent, 'unknown');
  assert.match(r.text, /chưa chắc hiểu/);
});

test('hint mode climbs a ladder of questions, then explains; reveal skips to the answer', () => {
  const history: TutorTurn[] = [];
  const say = (q: string) => { const r = reply(q, bubbleCtx, 'hint', history); history.push({ role: 'user', text: q }, { role: 'tutor', text: r.text, intent: r.intent === 'unknown' ? undefined : r.intent, level: r.level }); return r; };
  const first = say('dòng này làm gì?');
  assert.match(first.text, /thay giá trị/);
  assert.doesNotMatch(first.text, /ĐÚNG|SAI/, 'the first hint does not give the verdict away');
  assert.ok(first.suggestions.includes('Gợi ý thêm'));
  assert.match(say('Gợi ý thêm').text, /`5 > 3`/);
  const answer = say('Cho mình đáp án');
  assert.match(answer.text, /ĐÚNG → chạy các lệnh bên trong if/);
  assert.match(answer.text, /sai thứ tự tăng dần/);
  assert.equal(reply('dòng này làm gì?', bubbleCtx, 'explain').text, answer.text, 'reveal gives the same answer as explain mode');
});

test('variable history follows one call, not every recursive call of the function', () => {
  const main = { func: 'main', line: 9 }, f = (n: number) => ({ func: 'f', line: 2, params: { n } });
  const trace = [at(9, {}, [main]), at(2, { n: 2 }, [main, f(2)]), at(2, { n: 1 }, [main, f(2), f(1)]), at(3, { n: 1 }, [main, f(2), f(1)]), at(3, { n: 2 }, [main, f(2)])];
  assert.deepEqual(variableHistory(trace, 'n', 4).map(c => c.value), [2]);
  assert.deepEqual(variableHistory(trace, 'n', 2).map(c => c.value), [1]);
  const r = reply('n thay đổi thế nào', { code: 'int f(int n) {\n  if (n) return f(n - 1);\n  return 0;\n}\n', trace, step: 4 }, 'explain');
  assert.match(r.text, /lời gọi f\(2\)/);
  assert.match(r.text, /bản sao biến riêng/);
});

test('bugs are found in the recorded run and pointed at gently in hint mode', () => {
  const code = 'int main() {\n  int a[3] = {1, 2, 3};\n  for (int i = 0; i <= 3; i++) {\n    s += a[i];\n  }\n}';
  const trace = [0, 1, 2, 3].map(i => at(4, { a: [1, 2, 3], i, s: 0 }));
  const issues = findIssues(trace, code);
  assert.equal(issues.length, 1);
  assert.match(issues[0].text, /`a\[i\]` = `a\[3\]` nhưng `a` chỉ có 3 phần tử/);
  const ctx = { code, trace, step: 0 };
  assert.match(reply('code có lỗi không', ctx, 'hint').text, /dòng 4 ở bước 4.*bao nhiêu phần tử/);
  assert.match(reply('code có lỗi không', ctx, 'explain').text, /chỉ số hợp lệ 0\.\.2/);
  assert.match(findIssues([], 'x', { timeLimitExceeded: true })[0].text, /quá thời gian/);
  assert.match(findIssues([], 'x', { compilationError: "code.cpp:4:3: error: expected ';' before 'return'" })[0].text, /dòng 4.*expected ';'/);
});

test('concepts come from the course knowledge base, typed with or without diacritics', () => {
  assert.equal(findConcept('cay nhi phan tim kiem la gi')?.id, 'bst');
  assert.equal(findConcept('DSLK đôi khác DSLK đơn thế nào')?.id, 'doubly-linked');
  assert.equal(findConcept('dòng này làm gì'), undefined, '"dòng" must not be read as a concept');
  const r = reply('quick sort la gi', { code: '', trace: [], step: 0 }, 'explain');
  assert.match(r.text, /\*\*Quick Sort\*\* \(L8\)/);
  assert.match(r.text, /O\(n log n\)/);
  assert.match(reply('quick sort la gi', { code: '', trace: [], step: 0 }, 'hint').text, /chốt/);
});

test('complexity names the detected algorithm and reasons from the loop structure', () => {
  const r = reply('độ phức tạp là bao nhiêu', bubbleCtx, 'explain');
  assert.match(r.text, /Nổi bọt.*O\(n²\)/);
  assert.match(r.text, /2 vòng lặp lồng nhau/);
});

test('exercise help guides without handing over solution code', () => {
  const exercise = { id: 'L9-07', title: 'Tìm kiếm nhị phân', statement: 'Cài đặt tìm kiếm nhị phân trên mảng đã sắp xếp.', chapter: 'L9' };
  const hint = reply('gợi ý bài này', { code: '', trace: [], step: 0, exercise }, 'hint');
  assert.match(hint.text, /L9-07.*input và output/i);
  const explain = reply('gợi ý bài này', { code: '', trace: [], step: 0, exercise }, 'explain');
  assert.match(explain.text, /Tìm kiếm nhị phân/);
  assert.doesNotMatch(explain.text, /```/);
  assert.match(explain.text, /không đưa code lời giải/);
});

test('a question naming two concepts compares them', () => {
  const r = reply('bubble sort khac selection sort cho nao', { code: '', trace: [], step: 0 }, 'explain');
  assert.match(r.text, /\*\*Nổi bọt \(Bubble Sort\)\*\*[\s\S]*\*\*Chọn trực tiếp \(Selection Sort\)\*\*/);
});
