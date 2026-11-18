import test from 'node:test';
import assert from 'node:assert/strict';
import { detectAlgorithm, lineInsight, loopContext, recursiveReturns } from './src/engine/insight.ts';
import { lineFocus } from './src/engine/lineFocus.ts';
import type { TraceEvent } from './src/engine/types.ts';

const at = (line: number, variables: Record<string, unknown>, stack = [{ func: 'main', id: 1, line }]): TraceEvent =>
  ({ step: 0, line, event: 'line', callStack: stack.map((f, i) => i === stack.length - 1 ? { ...f, line } : f), variables, changed: [], detail: 'GCC/GDB: before' });
const why = (code: string, event: TraceEvent, next?: TraceEvent) => lineInsight(event, next, code, lineFocus(event, next, code));

const binarySearch = `int main() {
  int a[5] = {1, 3, 5, 7, 9};
  int left = 0, right = 4, target = 7;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (a[mid] == target) {
      break;
    } else if (a[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
}`;
const bs = { a: [1, 3, 5, 7, 9], left: 0, right: 4, target: 7, mid: 2 };

test('algorithms are recognised from the shape of the code', () => {
  assert.equal(detectAlgorithm(binarySearch)?.id, 'binary-search');
  assert.equal(detectAlgorithm('for(;;) if (a[j] > a[j + 1]) swap(a[j], a[j + 1]);')?.id, 'bubble-sort');
  assert.equal(detectAlgorithm('dp[i][j] = dp[i - 1][j] + dp[i][j - 1];')?.id, 'dp');
  assert.equal(detectAlgorithm('int f(int n) { if (n < 2) return n; return f(n - 1) + f(n - 2); }')?.id, 'recursion');
  assert.equal(detectAlgorithm('int x = 1; cout << x;'), undefined);
});

test('binary search explains which half is discarded and why', () => {
  assert.match(why(binarySearch, at(5, { ...bs, mid: null }), at(6, bs))[0], /vùng \[0\.\.4\]: mid = 2, a\[2\] = 5/);
  assert.match(why(binarySearch, at(8, bs), at(9, bs))[0], /5 < 7: .*chỉ có thể nằm bên phải mid/);
  assert.match(why(binarySearch, at(9, bs), at(4, { ...bs, left: 3 }))[0], /\[0\.\.4\] \(5 phần tử\) xuống \[3\.\.4\] \(2 phần tử\): bỏ các chỉ số 0\.\.2 bên trái/);
});

test('loop rounds are counted for every line inside the loop', () => {
  const code = 'int main() {\n  for (int i = 0; i < n - 1; i++) {\n    for (int j = 0; j < n - 1 - i; j++) {\n      x++;\n    }\n  }\n}';
  assert.deepEqual(loopContext(at(4, { n: 5, i: 1, j: 2, x: 0 }), code), ['vòng i: lần 2/4', 'vòng j: lần 3/3']);
});

test('bubble sort states the sorted tail only when the values confirm it', () => {
  const code = 'int main() {\n  for (int i = 0; i < n - 1; i++) {\n    for (int j = 0; j < n - 1 - i; j++) {\n      if (a[j] > a[j + 1]) {\n        swap(a[j], a[j + 1]);\n      }\n    }\n  }\n}';
  const sorted = { n: 4, i: 2, j: null, a: [2, 1, 7, 9] };
  assert.ok(why(code, at(3, sorted), at(4, { ...sorted, j: 0 })).some(s => /2 số lớn nhất \(7, 9\) đã nằm đúng chỗ/.test(s)));
  const unsorted = { ...sorted, a: [9, 1, 7, 2] };
  assert.ok(!why(code, at(3, unsorted), at(4, { ...unsorted, j: 0 })).some(s => /đúng chỗ/.test(s)));
  assert.match(why(code, at(4, { ...sorted, j: 0 }), at(5, { ...sorted, j: 0 }))[0], /\(2\) lớn hơn phần tử đứng sau \(1\) ⇒ sai thứ tự tăng dần/);
});

test('running totals and best-so-far are checked before being explained', () => {
  const code = 'int main() {\n  sum += a[i];\n  if (a[i] > best) {\n    best = a[i];\n  }\n}';
  assert.match(why(code, at(2, { a: [1, 2, 3], i: 2, sum: 3, best: 0 }), at(2, { a: [1, 2, 3], i: 2, sum: 6, best: 0 }))[0], /sum = 1 \+ 2 \+ 3 = 6/);
  assert.deepEqual(why(code, at(2, { a: [1, 2, 3], i: 2, sum: 9, best: 0 }), at(2, { a: [1, 2, 3], i: 2, sum: 12, best: 0 })), []);
  assert.match(why(code, at(3, { a: [4, 9, 7], i: 2, sum: 0, best: 9 }), at(6, { a: [4, 9, 7], i: 2, sum: 0, best: 9 }))[0], /best = 9 đang là số lớn nhất trong a\[0\.\.1\]\. a\[2\] = 7 không lớn hơn/);
});

test('recursion explains waiting calls and rebuilds each returned value', () => {
  const code = 'int f(int n) {\n  if (n <= 1) {\n    return 1;\n  }\n  return n * f(n - 1);\n}\nint main() {\n  int r = f(3);\n}';
  const main = { func: 'main', id: 1, line: 8 };
  const frame = (n: number, line: number, depth: number) => ({ func: 'f', id: depth + 1, line, params: { n } });
  const stack = (calls: [number, number][]) => [main, ...calls.map(([n, line], i) => frame(n, line, i + 1))];
  const trace = [
    at(8, { r: null }, [main]),
    at(2, { n: 3 }, stack([[3, 2]])), at(5, { n: 3 }, stack([[3, 5]])),
    at(2, { n: 2 }, stack([[3, 5], [2, 2]])), at(5, { n: 2 }, stack([[3, 5], [2, 5]])),
    at(2, { n: 1 }, stack([[3, 5], [2, 5], [1, 2]])), at(3, { n: 1 }, stack([[3, 5], [2, 5], [1, 3]])), at(6, { n: 1 }, stack([[3, 5], [2, 5], [1, 6]])),
    at(6, { n: 2 }, stack([[3, 5], [2, 6]])), at(6, { n: 3 }, stack([[3, 6]])), at(9, { r: 6 }, [main]),
  ];
  assert.match(why(code, trace[2], trace[3])[0], /f\(3\) tạm dừng ở dòng này để chờ f\(2\)/);
  assert.match(why(code, trace[5], trace[6])[0], /trường hợp cơ sở/);
  const returned = recursiveReturns(trace, code);
  assert.deepEqual([...returned.values()].map(r => [r.call, r.work, r.value, r.caller]), [['f(1)', undefined, 1, 'f(2)'], ['f(2)', '2 * 1', 2, 'f(3)'], ['f(3)', '3 * 2', 6, 'main']]);
  assert.match(lineInsight(trace[8], trace[9], code, undefined, undefined, returned.get(8))[0], /f\(2\) trả về 2 \* 1 = 2 cho f\(3\) đang chờ/);
});

test('dp cells name the subproblems they are built from', () => {
  const code = 'int main() {\n  dp[i][j] = dp[i - 1][j] + dp[i][j - 1];\n}';
  const v = { i: 1, j: 1, dp: [[1, 1], [1, 0]] };
  assert.match(why(code, at(2, v), at(2, { ...v, dp: [[1, 1], [1, 2]] }))[0], /dp\[1\]\[1\] được tính từ .*dp\[0\]\[1\] = 1 \(ô phía trên\) và dp\[1\]\[0\] = 1 \(ô bên trái\)/);
});

test('a call that returns nothing is not said to return a result', () => {
  const code = 'void walk(int n) {\n  if (n) walk(n - 1);\n}';
  const returned = { call: 'walk(1)', caller: 'main' };
  assert.equal(lineInsight(at(3, {}), undefined, code, undefined, undefined, returned)[0], 'walk(1) đã xong, quay lại main đang chờ.');
});

test('reading an unwritten value is called out', () => {
  const code = 'int main() {\n  s = s + 1;\n}';
  assert.match(why(code, { ...at(2, { s: null }), unset: ['s'] })[0], /Chú ý: dòng này đọc s khi chưa được gán/);
});

test('moving a pointer says which node it lands on', () => {
  const code = 'int main() {\n  p = p->next;\n  p = p->next;\n}';
  const heap = { '0x1': { type: 'Node', fields: { value: 1, next: '0x2' } }, '0x2': { type: 'Node', fields: { value: 7, next: '0x0' } } };
  assert.deepEqual(why(code, at(2, { p: '0x1' }), { ...at(3, { p: '0x2' }), heap }), ['p giờ trỏ tới nút 7.']);
  assert.deepEqual(why(code, at(3, { p: '0x2' }), { ...at(4, { p: '0x0' }), heap }), ['p giờ là NULL: không còn trỏ tới nút nào.']);
});
