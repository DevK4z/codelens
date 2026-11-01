import test from 'node:test';
import assert from 'node:assert/strict';
import { activeRange, controlledRange, evaluate, indexVariables, lineFocus } from './src/engine/lineFocus.ts';

const frame = [{ func: 'main', line: 1, id: 1 }];
const at = (line: number, variables: Record<string, unknown>, extra = {}) =>
  ({ step: 0, line, event: 'line', callStack: frame.map(f => ({ ...f, line })), variables, changed: [], detail: 'GCC/GDB: before', ...extra });

const binarySearch = `int main() {
  int a[5] = {1, 3, 5, 7, 9};
  int left = 0, right = 4, target = 7;
  while (left <= right) {
    int mid = (left + right) / 2;
    if (a[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  cout << left << endl;
}`;
const vars = { a: [1, 3, 5, 7, 9], left: 0, right: 4, target: 7, mid: 2 };

test('number expressions follow C++ integer rules and refuse anything else', () => {
  assert.equal(evaluate('(0 + 4) / 2'), 2);
  assert.equal(evaluate('-7 / 2'), -3);
  assert.equal(evaluate('7 % 3 == 1 && !false'), true);
  assert.equal(evaluate('5 < 9'), true);
  assert.equal(evaluate('1 / 0'), undefined);
  assert.equal(evaluate("'a' < 'b'"), true);
  assert.equal(evaluate("'\\n' < 9"), undefined);
  assert.equal(evaluate('x + 1'), undefined);
  assert.equal(evaluate('2147483647 + 1'), undefined);
});

test('a condition shows indices, then values, then the result, and the branch taken', () => {
  const focus = lineFocus(at(6, vars), at(7, vars), binarySearch)!;
  assert.equal(focus.kind, 'if');
  assert.deepEqual(focus.steps, ['a[mid] < target', 'a[2] < target', '5 < 7', 'true']);
  assert.equal(focus.outcome?.taken, true);
  assert.match(focus.outcome!.text, /ĐÚNG/);
  assert.deepEqual(focus.refs.map(r => [r.text, r.indices, r.value, r.access]), [['a[mid]', [2], 5, 'read']]);

  const skipped = lineFocus(at(6, { ...vars, mid: 3 }), at(9, vars), binarySearch)!;
  assert.equal(skipped.outcome?.taken, false);
  assert.match(skipped.outcome!.text, /SAI.*else/);
});

test('assignments show the computed value and what actually changed afterwards', () => {
  const focus = lineFocus(at(5, { ...vars, mid: null }), at(6, vars), binarySearch)!;
  assert.equal(focus.kind, 'declare');
  assert.deepEqual(focus.steps, ['(left + right) / 2', '(0 + 4) / 2', '2']);
  assert.deepEqual(focus.after, ['mid = 2']);

  const update = lineFocus(at(7, vars), at(4, { ...vars, left: 3 }), binarySearch)!;
  assert.match(update.summary, /lưu vào left/);
  assert.deepEqual(update.steps, ['mid + 1', '2 + 1', '3']);
  assert.deepEqual(update.after, ['left: 0 → 3']);
});

test('loops report whether another round runs from where the next step went', () => {
  assert.equal(lineFocus(at(4, vars), at(5, vars), binarySearch)!.outcome?.taken, true);
  const exit = lineFocus(at(4, { ...vars, left: 5 }), at(12, { ...vars, left: 5 }), binarySearch)!;
  assert.equal(exit.outcome?.taken, false);
  assert.match(exit.outcome!.text, /thoát/);
  assert.deepEqual(controlledRange(binarySearch, 6), { bodyStart: 7, end: 8, hasElse: true });
});

test('copies and swaps between cells are recognised as writes and reads', () => {
  const code = 'void f() {\n  a[j + 1] = a[j];\n  swap(a[i], a[i + 1]);\n  sum += a[i];\n}';
  const v = { a: [4, 2, 9], i: 0, j: 1, sum: 6 };
  const copy = lineFocus(at(2, v), null, code)!;
  assert.deepEqual(copy.refs.map(r => [r.text, r.indices[0], r.access]), [['a[j+1]', 2, 'write'], ['a[j]', 1, 'read']]);
  const swap = lineFocus(at(3, v), null, code)!;
  assert.equal(swap.kind, 'swap');
  assert.deepEqual(swap.steps, ['a[i] ⇄ a[i + 1]', '4 ⇄ 2']);
  const add = lineFocus(at(4, v), null, code)!;
  assert.match(add.summary, /Cộng thêm a\[i\] vào sum/);
  assert.deepEqual(add.steps, ['sum + a[i]', 'sum + a[0]', '6 + 4', '10']);
});

test('index variables and the active range are found from the source', () => {
  assert.deepEqual(indexVariables(binarySearch, 'a'), { rows: ['mid'], cols: [] });
  assert.deepEqual(indexVariables('dp[i][j] = dp[i - 1][j] + a[n - 1] + a[k];', 'dp'), { rows: ['i'], cols: ['j'] });
  assert.deepEqual(indexVariables('x = a[n - 1] + a[i + 1];', 'a').rows, ['i']);
  assert.deepEqual(activeRange(vars, Object.keys(vars)), { from: 'left', to: 'right' });
});

test('output, input, function headers and string literals are described plainly', () => {
  const code = 'int main() {\n  cin >> n;\n  cout << "n = " << n << endl;\n}';
  assert.equal(lineFocus(at(1, {}), null, code)!.summary, 'Bắt đầu hàm main');
  assert.match(lineFocus(at(2, { n: 0 }), null, code)!.summary, /input vào n/);
  assert.deepEqual(lineFocus(at(3, { n: 5 }), null, code)!.steps, ['"n = " , n', '"n = " , 5']);
});

test('declarations with several variables, nested vectors and ended loop counters read correctly', () => {
  const code = 'int main() {\n  int left = 0, right = n - 1;\n  vector<vector<int>> dp(3, vector<int>(3, 0));\n  x = 1;\n}';
  assert.equal(lineFocus(at(2, { n: 7 }), null, code)!.summary, 'Tạo các biến left = 0, right = n - 1');
  assert.match(lineFocus(at(3, {}), null, code)!.summary, /^Tạo vector dp gồm 3 phần tử/);
  const after = lineFocus(at(4, { j: 3, dp: [[0, 0], [0, 0]] }), at(5, { j: null, dp: [[0, 0], [0, 2]] }), code)!.after;
  assert.deepEqual(after, ['dp[1][1]: 0 → 2']);
});
