import { JSDOM } from 'jsdom';
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5173' });
for (const key of ['window', 'document', 'HTMLElement', 'localStorage', 'MutationObserver'])
  Object.defineProperty(globalThis, key, { value: (dom.window as any)[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { render, screen, fireEvent, cleanup, waitFor, within } = await import('@testing-library/react');
mock.module('./src/components/CodeEditor.tsx', {
  namedExports: { CodeEditor: (props: any) => React.createElement('textarea', { 'aria-label': 'Test code editor', value: props.code, onChange: () => {} }) },
});
// import.meta.glob only exists under Vite; the real loader is covered by exams.test.ts compiling every file.
let loads = 0;
mock.module('./src/data/examSolutionLoader.ts', {
  namedExports: { getSolution: (id: string) => { loads++; return { idea: `Ý tưởng cho ${id}`, time: 'O(n)', space: 'O(1)', code: `// LOI GIAI ${id}\nint main() {}` }; } },
});
const { ExamMode } = await import('./src/components/ExamMode.tsx');
const { PRESET_SPECS, resolveExam } = await import('./src/data/exams.ts');
const { EXAM_HISTORY_KEY, createSession, historyEntry, saveSession, scoreProblem } = await import('./src/engine/examGrading.ts');

const spec = { ...PRESET_SPECS[0], proctored: false };
const exam = resolveExam(spec)!;
const [p1, p2] = exam.problems;
const mine = '// CODE CUA TOI\nint main() { return 0; }';

function submitted() {
  const s = createSession(spec, 0);
  s.codes[p1.id] = mine;
  const verdicts = p1.tests.map((_, i) => (i === 0 ? 'AC' : 'WA') as const);
  s.results[p1.id] = { code: mine, verdicts: [...verdicts], score: scoreProblem(p1, [...verdicts]) };
  s.results[p2.id] = { code: p2.starterCode, verdicts: p2.tests.map(() => 'WA' as const), score: 0, message: 'Chưa làm bài.' };
  return { ...s, submittedAt: 60_000, submitReason: 'manual' as const };
}

test('after submitting, each problem shows my code next to the optimal solution', async () => {
  cleanup(); localStorage.clear();
  saveSession(submitted());
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));
  const first = await waitFor(() => screen.getByRole('article', { name: 'Xem lại bài 1' }));
  assert.match(within(first).getByLabelText('Code của bạn cho bài 1').textContent ?? '', /CODE CUA TOI/);
  await waitFor(() => assert.match(within(first).getByLabelText('Lời giải tối ưu cho bài 1').textContent ?? '', new RegExp(`LOI GIAI ${p1.id}`)));
  assert.match(first.textContent ?? '', new RegExp(`Ý tưởng cho ${p1.id}`));
  assert.match(first.textContent ?? '', /Thời gian:\s*O\(n\)/);
  assert.match(first.textContent ?? '', new RegExp(`1/${p1.tests.length} test đúng`));
  const second = screen.getByRole('article', { name: 'Xem lại bài 2' });
  assert.match(second.textContent ?? '', /Bạn chưa viết bài này/);
  assert.match(second.textContent ?? '', new RegExp(`LOI GIAI ${p2.id}`));
});

test('history entries open a review with the saved code and the optimal solutions', async () => {
  cleanup(); localStorage.clear();
  const s = submitted();
  const entry = historyEntry(exam, s, 10);
  const legacy = { ...historyEntry(exam, { ...s, startedAt: 5 }, 10), codes: undefined, verdicts: undefined, at: 1 };
  localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify([entry, legacy]));
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));

  const buttons = await waitFor(() => screen.getAllByRole('button', { name: /Xem lại/ }));
  assert.equal(buttons.length, 2);
  fireEvent.click(buttons[0]);
  const card = await waitFor(() => screen.getByRole('article', { name: 'Xem lại bài 1' }));
  assert.match(card.textContent ?? '', /CODE CUA TOI/);
  await waitFor(() => assert.match(card.textContent ?? '', new RegExp(`LOI GIAI ${p1.id}`)));
  assert.equal(buttons[0].getAttribute('aria-expanded'), 'true');

  // An attempt saved before this feature still shows the optimal solutions.
  fireEvent.click(buttons[0]);
  fireEvent.click(buttons[1]);
  const old = await waitFor(() => screen.getByRole('article', { name: 'Xem lại bài 1' }));
  assert.match(old.textContent ?? '', /được lưu trước khi có tính năng xem lại/);
  await waitFor(() => assert.match(old.textContent ?? '', new RegExp(`LOI GIAI ${p1.id}`)));
});

test('solutions are not loaded while an exam is in progress', async () => {
  cleanup(); localStorage.clear();
  loads = 0;
  saveSession(createSession(spec));
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));
  await waitFor(() => screen.getByLabelText('Test code editor'), { timeout: 3000 });
  await new Promise(r => setTimeout(r, 100));
  assert.equal(loads, 0);
  assert.equal(document.body.textContent?.includes('LOI GIAI'), false);
});
