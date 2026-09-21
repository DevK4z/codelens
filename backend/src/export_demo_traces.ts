import * as fs from 'fs';
import * as path from 'path';
import { tokenize } from './engine/lexer';
import { parse } from './engine/parser';
import { instrument } from './engine/instrumenter';
import { runCode } from './runner/local';

const samples = [
  {
    id: 'array-sum',
    stdin: '5\n1 2 3 4 5\n',
    code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[10];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    int sum = 0;
    for (int i = 0; i < n; i++) {
        sum = sum + arr[i];
    }
    cout << sum << endl;
    return 0;
}`
  },
  {
    id: 'binary-search',
    stdin: '7\n1 3 5 7 9 11 13\n7\n',
    code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[10];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    int target;
    cin >> target;
    int left = 0, right = n - 1;
    int result = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;
            break;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    cout << result << endl;
    return 0;
}`
  },
  {
    id: 'bubble-sort',
    stdin: '5\n5 3 1 4 2\n',
    code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[10];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    return 0;
}`
  },
  {
    id: 'factorial',
    stdin: '5\n',
    code: `#include <iostream>
using namespace std;

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int n;
    cin >> n;
    int result = factorial(n);
    cout << result << endl;
    return 0;
}`
  }
];

async function exportTraces() {
  const tracesMap: Record<string, any> = {};

  for (const s of samples) {
    console.log(`Generating real trace for: ${s.id}...`);
    const tokens = tokenize(s.code);
    const ast = parse(tokens);
    const inst = instrument(ast, s.code);
    const res = await runCode(inst, s.stdin);
    tracesMap[s.id] = {
      trace: res.trace,
      stdout: res.stdout,
      stepCount: res.trace.length,
      executionTimeMs: res.executionTimeMs,
      isDemo: true,
      sandboxWarning: 'Dữ liệu mô phỏng từ lần chạy C++ thật (Chế độ xem trước GitHub Pages)'
    };
  }

  const outContent = `import { ExecuteResponse } from '../engine/types';

export const DEMO_TRACES: Record<string, Partial<ExecuteResponse>> = ${JSON.stringify(tracesMap, null, 2)};

export function getFallbackDemoTrace(code: string): Partial<ExecuteResponse> | null {
  if (code.includes('factorial')) return DEMO_TRACES['factorial'];
  if (code.includes('binary') || code.includes('mid =') || code.includes('target')) return DEMO_TRACES['binary-search'];
  if (code.includes('arr[j] > arr[j + 1]') || code.includes('temp = arr[j]')) return DEMO_TRACES['bubble-sort'];
  return DEMO_TRACES['array-sum'];
}
`;

  const destPath = path.resolve(process.cwd(), '../frontend/src/data/demoTraces.ts');
  fs.writeFileSync(destPath, outContent);
  console.log(`Saved demo traces to: ${destPath}`);
}

exportTraces();
