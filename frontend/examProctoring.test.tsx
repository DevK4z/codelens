import { JSDOM } from 'jsdom';
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5173' });
for (const key of ['window', 'document', 'HTMLElement', 'localStorage', 'MutationObserver'])
  Object.defineProperty(globalThis, key, { value: (dom.window as any)[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
// The exam is already in fullscreen (jsdom has no Fullscreen API).
Object.defineProperty(dom.window.document, 'fullscreenElement', { get: () => dom.window.document.body, configurable: true });
globalThis.fetch = async () => new Response(JSON.stringify({ status: 'ok', runner: 'sandbox' }), { headers: { 'Content-Type': 'application/json' } });

const React = await import('react');
const { render, screen, fireEvent, cleanup, waitFor } = await import('@testing-library/react');
mock.module('./src/components/CodeEditor.tsx', {
  namedExports: { CodeEditor: (props: any) => React.createElement('textarea', { 'aria-label': 'Test code editor', value: props.code, onChange: (e: any) => props.onChange(e.target.value) }) },
});
const { ExamMode } = await import('./src/components/ExamMode.tsx');
const { generateExamSpec } = await import('./src/data/exams.ts');
const { createSession, saveSession, loadSession } = await import('./src/engine/examGrading.ts');

function seed() {
  cleanup();
  localStorage.clear();
  const spec = generateExamSpec({ chapters: ['L5'], problemCount: 1, proctored: true, maxViolations: 5, seed: 1 });
  saveSession(createSession(spec));
}
const violations = () => loadSession()?.violations.map(v => v.reason) ?? [];
const editor = () => screen.getByLabelText('Test code editor') as HTMLTextAreaElement;
const ready = () => waitFor(() => editor(), { timeout: 3000 });

test('pasting a large block by any route is reverted and recorded', async () => {
  seed();
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));
  await ready();
  const before = editor().value;
  const block = '    long long n; cin >> n; vector<long long> a(n); for (auto& x : a) cin >> x; sort(a.begin(), a.end());\n';
  fireEvent.change(editor(), { target: { value: before.replace('    // Viết lời giải ở đây\n', block) } });
  await waitFor(() => assert.equal(editor().value, before, 'editor shows the code from before the paste'));
  assert.match(violations().join('|'), /Chèn một khối \d+ ký tự vào bài 1.*đã hoàn tác/);
  assert.match(screen.getByRole('alert').textContent ?? '', /Cảnh báo vi phạm 1\/5/);

  // Normal typing right after is accepted.
  fireEvent.change(editor(), { target: { value: before.replace('return 0;', 'int x; return 0;') } });
  await waitFor(() => assert.match(editor().value, /int x; return 0;/));
  assert.equal(violations().length, 1);
});

test('copy and cut are blocked everywhere, including the editor', async () => {
  seed();
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));
  await ready();
  for (const type of ['copy', 'cut']) {
    const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
    editor().dispatchEvent(event);
    assert.equal(event.defaultPrevented, true, `${type} is prevented`);
  }
});

test('a second tab is locked and the tab taking the exam records a violation', async () => {
  seed();
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));
  await ready();
  await new Promise(r => setTimeout(r, 600)); // first tab finished claiming the exam
  const second = document.createElement('div');
  document.body.appendChild(second);
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }), { container: second });
  await waitFor(() => assert.ok(screen.getByText('Bài thi đang mở ở tab khác')), { timeout: 3000 });
  await waitFor(() => assert.ok(violations().includes('Mở bài thi ở một tab khác')), { timeout: 3000 });
  assert.equal(screen.getAllByLabelText('Test code editor').length, 1, 'the locked tab does not show the exam');
});

test('the builder offers a stricter auto-submit threshold for proctored exams', async () => {
  cleanup();
  localStorage.clear();
  render(React.createElement(ExamMode, { theme: 'dark', onExit: () => {} }));
  const select = await waitFor(() => screen.getByRole('combobox')) as HTMLSelectElement;
  fireEvent.change(select, { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: /Tạo đề/ }));
  await waitFor(() => assert.match(document.body.textContent ?? '', /Đủ 1 lần vi phạm/));
  assert.match(document.body.textContent ?? '', /một màn hình/);
});
