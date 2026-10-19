import { JSDOM } from 'jsdom';
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5173' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLDialogElement', 'localStorage', 'MutationObserver'])
  Object.defineProperty(globalThis, key, { value: (dom.window as any)[key], configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
const requests: any[] = [];
globalThis.fetch = async (_url, options) => {
  if (options?.body) requests.push(JSON.parse(String(options.body)));
  return new Response(JSON.stringify(options?.body
    ? { success: true, trace: [], stdout: 'ok', executionMode: 'run' }
    : { status: 'ok', runner: 'docker' }), { headers: { 'Content-Type': 'application/json' } });
};
const React = await import('react');
const { render, screen, fireEvent, cleanup, waitFor, act } = await import('@testing-library/react');
mock.module('./src/components/CodeEditor.tsx', {
  namedExports: { CodeEditor: (props: any) => React.createElement('textarea', { 'aria-label': 'Test code editor', value: props.code, onChange: (e: any) => props.onChange(e.target.value) }) },
});
const { default: App } = await import('./src/App');
const { SAVED_RUN_KEY } = await import('./src/utils/savedRun');
const original = { version: 1, code: '// MY MAIN CODE\nint main(){return 7;}', stdin: 'my input', mode: 'run', standard: 'gnu++20', savedAt: 1 };
function seed() { cleanup(); localStorage.clear(); localStorage.setItem(SAVED_RUN_KEY, JSON.stringify(original)); requests.length = 0; }
const choose = (id: string) => fireEvent.change(screen.getByRole('combobox', { name: 'Chọn bài mẫu' }), { target: { value: id } });

test('preview, exercise browsing and closing never replace the main input or saved code', async () => {
  seed(); render(<App />);
  choose('factorial');
  assert.match(screen.getByLabelText('Code mẫu chỉ đọc').textContent!, /factorial/);
  assert.equal((screen.getByPlaceholderText(/Nhập dữ liệu/) as HTMLTextAreaElement).value, 'my input');
  fireEvent.click(screen.getByRole('button', { name: 'Đóng xem trước' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ngân hàng bài tập' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Xem đề', exact: true })[0]);
  assert.equal(JSON.parse(localStorage.getItem(SAVED_RUN_KEY)!).code, original.code);
  fireEvent.click(screen.getByRole('button', { name: 'Chạy', exact: true }));
  await waitFor(() => assert.equal(requests.length, 1));
  assert.equal(requests[0].code, original.code);
  assert.equal(requests[0].stdin, original.stdin);
  cleanup();
});

test('trying, editing input, running and switching samples preserves main; return and reload restore it', async () => {
  seed(); render(<App />);
  fireEvent.change(screen.getByLabelText('Test code editor'), { target: { value: '// UNSAVED MAIN CODE' } });
  const editedCode = '// UNSAVED MAIN CODE';
  // An unsaved input edit must also be backed up before entering the sample workspace.
  fireEvent.change(screen.getByPlaceholderText(/Nhập dữ liệu/), { target: { value: 'unsaved main input' } });
  choose('factorial'); fireEvent.click(screen.getByRole('button', { name: 'Thử mẫu riêng' }));
  fireEvent.change(screen.getByPlaceholderText(/Nhập dữ liệu/), { target: { value: '6' } });
  fireEvent.click(screen.getByRole('button', { name: 'Chạy', exact: true }));
  await waitFor(() => assert.equal(requests.length, 1));
  assert.match(requests[0].code, /factorial/);
  assert.equal(JSON.parse(localStorage.getItem(SAVED_RUN_KEY)!).code, editedCode);
  assert.equal(JSON.parse(localStorage.getItem(SAVED_RUN_KEY)!).stdin, 'unsaved main input');
  choose('binary-search'); fireEvent.click(screen.getByRole('button', { name: 'Thử mẫu riêng' }));
  fireEvent.click(screen.getByRole('button', { name: 'Quay về code chính' }));
  assert.equal((screen.getByPlaceholderText(/Nhập dữ liệu/) as HTMLTextAreaElement).value, 'unsaved main input');
  assert.equal((screen.getByRole('combobox', { name: 'Chuẩn C++' }) as HTMLSelectElement).value, 'gnu++20');
  fireEvent.click(screen.getByRole('button', { name: 'Chạy', exact: true }));
  await waitFor(() => assert.equal(requests.length, 2)); assert.equal(requests[1].code, editedCode);
  choose('bubble-sort'); fireEvent.click(screen.getByRole('button', { name: 'Thử mẫu riêng' }));
  cleanup(); render(<App />);
  assert.equal(screen.queryByRole('button', { name: 'Quay về code chính' }), null);
  assert.equal((screen.getByPlaceholderText(/Nhập dữ liệu/) as HTMLTextAreaElement).value, 'unsaved main input');
  fireEvent.click(screen.getByRole('button', { name: 'Chạy', exact: true }));
  await waitFor(() => assert.equal(requests.length, 3)); assert.equal(requests[2].code, editedCode);
  cleanup();
});

test('storage failure blocks sample workspace instead of risking the main draft', async () => {
  seed(); render(<App />); choose('factorial');
  const savedSet = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = () => { throw new Error('quota'); };
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Thử mẫu riêng' }));
    assert.ok(screen.getByText(/Không lưu được code chính/));
    assert.equal(screen.queryByRole('button', { name: 'Quay về code chính' }), null);
    assert.equal((screen.getByPlaceholderText(/Nhập dữ liệu/) as HTMLTextAreaElement).value, original.stdin);
  } finally { dom.window.Storage.prototype.setItem = savedSet; cleanup(); }
});

test('run mode shows output workspace; visualization controls only appear in visualization mode', async () => {
  seed(); render(<App />);
  assert.ok(screen.getByRole('region', { name: 'Kết quả chạy C++' }));
  assert.equal(screen.queryByRole('slider', { name: 'Bước thực thi' }), null);
  fireEvent.click(screen.getByRole('button', { name: 'Trực quan hóa', exact: true }));
  assert.equal(screen.queryByRole('region', { name: 'Kết quả chạy C++' }), null);
  assert.ok(screen.getByRole('slider', { name: 'Bước thực thi' }));
  assert.equal((screen.getByLabelText('Test code editor') as HTMLTextAreaElement).value, original.code);
  fireEvent.click(screen.getByRole('button', { name: 'Chạy C++', exact: true }));
  fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
  await waitFor(() => assert.equal(requests.length, 1));
  assert.equal(requests[0].code, original.code);
  assert.equal(requests[0].executionMode ?? requests[0].mode, 'run');
  cleanup();
});

const { SimpleStepExplanation } = await import('./src/components/SimpleStepExplanation');
test('changing steps clears stale AI and cancels its request without sending anything automatically', async () => {
  cleanup(); const originalFetch = globalThis.fetch; let count = 0; let signal: AbortSignal | undefined;
  let resolve!: (value: Response) => void;
  globalThis.fetch = async (_url, options) => { count++; signal = options?.signal as AbortSignal; return new Promise<Response>(r => { resolve = r; }); };
  const event = {step:0,line:1,event:'line',variables:{},changed:[],callStack:[{func:'main',line:1}],detail:'GCC/GDB: before'};
  try {
    const view = render(<SimpleStepExplanation event={event} code={'int n;\ncin >> n;'} />);
    assert.equal(count,0);
    fireEvent.click(screen.getByText('✨ Giải thích dễ hơn bằng AI'));
    fireEvent.change(screen.getByLabelText('Gemini API key'),{target:{value:'test-key'}});
    fireEvent.click(screen.getByRole('button',{name:'Hỏi AI về bước này'}));
    await waitFor(()=>assert.equal(count,1));
    view.rerender(<SimpleStepExplanation event={{...event,step:1,line:2}} code={'int n;\ncin >> n;'} />);
    assert.equal(signal?.aborted,true);
    await act(async () => { resolve(new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({action:'OLD ANSWER',change:'Old',next:'Old'})}]}}]})));
    await new Promise(r=>setTimeout(r,0)); });
    assert.equal(screen.queryByText('OLD ANSWER'),null);
    assert.ok(screen.getByText('Sắp lấy dữ liệu bạn đã nhập.'));
  } finally { globalThis.fetch=originalFetch; cleanup(); }
});
