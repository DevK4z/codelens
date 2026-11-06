import test from 'node:test';
import assert from 'node:assert/strict';
import { activeRange, controlledRange, definedTypes, evaluate, globalConstants, indexVariables, lineFocus } from './src/engine/lineFocus.ts';

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

const custom = `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
using pii = pair<int, int>;
#define vi vector<int>
struct Node { int v; Node *next; };
const ll MOD = 1000000007;
const int N = 5, M = 7;
static const ll INF = 1e18;
ll power(const ll &a, ll b) {
  ll r = 1;
  const ll base = a % MOD;
  Node *p = head;
  ops.push(c);
  st.pop();
  v.push_back(x + 1);
  delete p;
  sort(a.begin(), a.end());
  visit(p->left, d + 1);
  if (c == '(') {
    r = 2;
  }
  return r;
}
`;

test('types the program defines are types, and file-scope constants are recognised', () => {
  assert.deepEqual(definedTypes(custom).sort(), ['Node', 'll', 'pii', 'vi'].sort());
  assert.deepEqual([...globalConstants(custom)].sort(), ['INF', 'M', 'MOD', 'N']);
  const code = 'int main() {\n  const int local = 1;\n}\nconst int LATE = 2;';
  assert.deepEqual([...globalConstants(code)], ['LATE'], 'a local const stays visible');
});

test('declarations with defined types and function headers read as such', () => {
  const summary = (line: number, vars: Record<string, unknown> = {}) => lineFocus(at(line, vars), null, custom)!;
  assert.equal(summary(10).summary, 'Bắt đầu hàm power');
  assert.equal(summary(11).summary, 'Tạo biến r và gán giá trị 1');
  const constant = summary(12, { a: 10, MOD: 7 });
  assert.equal(constant.summary, 'Tạo biến base và gán giá trị a % MOD');
  assert.deepEqual(constant.steps, ['a % MOD', '10 % 7', '3'], 'constants keep their value in the substitution');
  assert.equal(summary(13).summary, 'Tạo biến p và gán giá trị head');
});

test('calls and delete are said in plain words', () => {
  const summary = (line: number) => lineFocus(at(line, {}), null, custom)!.summary;
  assert.equal(summary(14), 'Đưa c vào ops');
  assert.equal(summary(15), 'Lấy phần tử tiếp theo ra khỏi st');
  assert.equal(summary(16), 'Thêm x + 1 vào cuối v');
  assert.equal(summary(17), 'Giải phóng vùng nhớ mà p đang trỏ tới');
  assert.equal(summary(18), 'Sắp xếp a tăng dần');
  assert.equal(summary(19), 'Gọi hàm visit với p->left, d + 1');
});

test('a parenthesis inside a character literal does not end a condition', () => {
  const focus = lineFocus(at(20, { c: '(' }), at(21, { c: '(' }), custom)!;
  assert.equal(focus.kind, 'if');
  assert.equal(focus.summary, "Kiểm tra điều kiện c == '('");
  assert.equal(focus.outcome?.taken, true);
});

test('compound assignments, user methods and multi-line statements read correctly', () => {
  const code = 'int main() {\n  b /= 2;\n  a -= c;\n  r *= x;\n  n %= 3;\n  h.put(s);\n  l.print();\n  *it = y;\n  (f(a) ||\n  a[i] > 0 ? 1 : 2;\n}';
  const summary = (line: number) => lineFocus(at(line, {}), null, code)!.summary;
  assert.equal(summary(2), 'Chia b cho 2');
  assert.equal(summary(3), 'Trừ bớt c khỏi a');
  assert.equal(summary(4), 'Nhân r với x');
  assert.equal(summary(5), 'Lấy n chia 3 lấy dư');
  assert.equal(summary(6), 'Gọi phương thức put của h với s');
  assert.equal(summary(7), 'Gọi phương thức print của l');
  assert.equal(summary(8), 'Gán y vào *it');
  assert.match(summary(9), /^Phần tiếp theo của câu lệnh/);
  assert.equal(summary(10), 'Tính biểu thức a[i] > 0 ? 1 : 2');
});

test('a name that merely starts like a type is not a declaration', () => {
  const code = 'int main() {\n  longest = 3;\n  integer(2);\n  int*p = q;\n  vector<int>v;\n}';
  const summary = (line: number) => lineFocus(at(line, {}), null, code)!.summary;
  assert.equal(summary(2), 'Gán 3 vào longest');
  assert.equal(summary(3), 'Gọi hàm integer với 2');
  assert.equal(summary(4), 'Tạo biến p và gán giá trị q');
  assert.equal(summary(5), 'Tạo biến v');
});

test('a for loop shows its start, each step and the check that ends it', () => {
  const code = 'int main() {\n  for (int i = 0; i < 3; i++) {\n    s += i;\n  }\n  return s;\n}';
  const start = lineFocus(at(2, { i: null, s: 0 }), at(3, { i: 0, s: 0 }), code)!;
  assert.match(start.summary, /^Vòng lặp for: khởi tạo int i = 0/);
  assert.deepEqual(start.steps, ['i < 3', '0 < 3', 'true']);

  const again = lineFocus(at(2, { i: 0, s: 0 }), at(3, { i: 1, s: 0 }), code)!;
  assert.equal(again.summary, 'Hết một vòng: thực hiện i++, rồi kiểm tra lại i < 3');
  assert.deepEqual(again.steps, ['i < 3', '1 < 3', 'true']);
  assert.equal(again.outcome?.taken, true);

  const end = lineFocus(at(2, { i: 2, s: 3 }), at(5, { i: null, s: 3 }), code)!;
  assert.deepEqual(end.steps, ['i < 3', '3 < 3', 'false']);
  assert.equal(end.outcome?.taken, false);
  assert.deepEqual(end.after, ['i: 2 → 3']);
});

test('leaving a function says where the program goes back to', () => {
  const stack = [{ func: 'main', line: 9 }, { func: 'f', line: 2 }];
  const code = 'int f() {\n  return 1;\n}';
  const event = { ...at(2, {}), callStack: stack };
  assert.match(lineFocus(event, at(9, {}), code)!.after[0], /^Hàm f kết thúc, quay lại main ở dòng 9/);
});

test('a loop on one line explains its body at each round', () => {
  const code = 'int main() {\n  for (int i = 2; i <= n; i++) f[i] = f[i - 1] + f[i - 2];\n  return f[n];\n}';
  const vars = { n: 3, i: 2, f: [0, 1, null, null] };
  const round = lineFocus(at(2, vars), at(2, { ...vars, i: 3, f: [0, 1, 1, null] }), code)!;
  assert.match(round.summary, /^Thân vòng lặp: Tính f\[i - 1\] \+ f\[i - 2\] rồi lưu vào f\[i\]/);
  assert.deepEqual(round.steps.at(-1), '1');
  assert.deepEqual(round.refs.map(r => [r.text, r.access]), [['f[i]', 'write'], ['f[i-1]', 'read'], ['f[i-2]', 'read']]);
  const start = lineFocus(at(2, { ...vars, i: null }), at(2, vars), code)!;
  assert.match(start.summary, /^Vòng lặp for/);
});

test('reading into a cell marks it as written', () => {
  const code = 'int main() {\n  cin >> a[i];\n}';
  assert.deepEqual(lineFocus(at(2, { a: [0, 0], i: 1 }), null, code)!.refs.map(r => [r.array, r.indices, r.access]), [['a', [1], 'write']]);
});

test('several statements on a line are each described', () => {
  const code = 'int main() {\n  f[0] = 0; f[1] = 1;\n  cout << "a;b";\n}';
  const focus = lineFocus(at(2, { f: [5, 6] }), at(3, { f: [0, 1] }), code)!;
  assert.equal(focus.summary, 'Gán 0 vào f[0], rồi Gán 1 vào f[1]');
  assert.deepEqual(focus.refs.map(r => r.indices[0]), [0, 1]);
  assert.deepEqual(focus.after, ['f[0]: 5 → 0', 'f[1]: 6 → 1']);
  assert.equal(lineFocus(at(3, {}), null, code)!.kind, 'output', 'a semicolon inside a string separates nothing');
});

test('a one-line range-for does not guess the element of this round', () => {
  const code = 'int main() {\n  for (int x : v) s += x;\n}';
  const focus = lineFocus(at(2, { x: 0, s: 0, v: [1, 2] }), at(2, { x: 1, s: 1, v: [1, 2] }), code)!;
  assert.deepEqual(focus.steps, []);
  assert.deepEqual(focus.after, ['s: 0 → 1', 'x: 0 → 1'].sort((a, b) => focus.after.indexOf(a) - focus.after.indexOf(b)));
});
