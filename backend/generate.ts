import * as fs from 'fs';
import { tokenize } from './src/engine/lexer';
import { parse } from './src/engine/parser';
import { instrument } from './src/engine/instrumenter';
import { runCode } from './src/runner/local';

const samples = [
  { id: 'array-sum', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[10];\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    int sum = 0;\n    for (int i = 0; i < n; i++) {\n        sum = sum + arr[i];\n    }\n    cout << sum << endl;\n    return 0;\n}`, stdin: '5\n1 2 3 4 5\n' },
  { id: 'binary-search', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[10];\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    int target;\n    cin >> target;\n    int left = 0, right = n - 1;\n    int result = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) {\n            result = mid;\n            break;\n        } else if (arr[mid] < target) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << result << endl;\n    return 0;\n}`, stdin: '7\n1 3 5 7 9 11 13\n7\n' },
  { id: 'bubble-sort', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int arr[10];\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    for (int i = 0; i < n - 1; i++) {\n        for (int j = 0; j < n - 1 - i; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n    for (int i = 0; i < n; i++) {\n        cout << arr[i] << " ";\n    }\n    cout << endl;\n    return 0;\n}`, stdin: '5\n5 3 1 4 2\n' },
  { id: 'factorial', code: `#include <iostream>\nusing namespace std;\n\nint factorial(int n) {\n    if (n <= 1) {\n        return 1;\n    }\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int n;\n    cin >> n;\n    int result = factorial(n);\n    cout << result << endl;\n    return 0;\n}`, stdin: '5\n' }
];

async function generate() {
  const traces: Record<string, any> = {};
  for (const s of samples) {
    const tokens = tokenize(s.code);
    const ast = parse(tokens);
    const inst = instrument(ast, s.code);
    const res = await runCode(inst, s.stdin);
    traces[s.id] = { trace: res.trace, stdout: res.stdout, stepCount: res.trace.length, success: true };
  }
  
  const fileContent = `import { ExecuteResponse } from '../engine/types';
import { SAMPLES } from './samples';

export const DEMO_TRACES: Record<string, Partial<ExecuteResponse>> = ${JSON.stringify(traces, null, 2)};

export function getFallbackDemoTrace(code: string, stdin: string): Partial<ExecuteResponse> | null {
  const match = SAMPLES.find(s => s.code === code && s.stdin === stdin);
  if (match) {
    return DEMO_TRACES[match.id];
  }
  return null;
}
`;

  fs.writeFileSync('../frontend/src/data/demoTraces.ts', fileContent);
  console.log('Successfully generated demoTraces.ts!');
}

generate().catch(console.error);
