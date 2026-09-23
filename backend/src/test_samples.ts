import { tokenize } from './engine/lexer.js';
import { parse } from './engine/parser.js';
import { instrument } from './engine/instrumenter.js';
import { runCode } from './runner/local.js';

const samples = [
  {
    name: 'Tính tổng mảng',
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
    name: 'Tìm kiếm nhị phân',
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
    name: 'Sắp xếp nổi bọt',
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
    name: 'Giai thừa đệ quy',
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

async function runTests() {
  console.log('=== TESTING CODELENS SAMPLES ===');
  for (const s of samples) {
    console.log(`\n--- Test: ${s.name} ---`);
    try {
      const tokens = tokenize(s.code);
      console.log('Tokens count:', tokens.length);
      const ast = parse(tokens);
      console.log('AST functions:', ast.functions.map(f => f.name));
      const instrumented = instrument(ast, s.code);
      console.log('Instrumented code length:', instrumented.length);

      const res = await runCode(instrumented, s.stdin);
      console.log(`Execution result:
- Exit code: ${res.exitCode}
- Time limit exceeded: ${res.timeLimitExceeded}
- Step limit exceeded: ${res.stepLimitExceeded}
- Steps recorded: ${res.trace.length}
- Stdout: ${JSON.stringify(res.stdout)}`);

      if (res.trace.length > 0) {
        console.log('Sample step 0 variables:', JSON.stringify(res.trace[0].variables));
        const midStep = res.trace[Math.floor(res.trace.length / 2)];
        console.log(`Sample mid step (${midStep.step}) variables:`, JSON.stringify(midStep.variables));
        console.log('Sample last step variables:', JSON.stringify(res.trace[res.trace.length - 1].variables));
        const compares = res.trace.filter(t => t.compareInfo);
        if (compares.length > 0) console.log(`Sample compare (${compares[0].step}):`, JSON.stringify(compares[0].compareInfo));
        const writes = res.trace.filter(t => t.arrayAccess);
        if (writes.length > 0) console.log(`Sample array access (${writes[0].step}):`, JSON.stringify(writes[0].arrayAccess));
        const swaps = res.trace.filter(t => t.swapInfo);
        if (swaps.length > 0) console.log(`Sample swap (${swaps[0].step}):`, JSON.stringify(swaps[0].swapInfo));
      }
      if (res.stderr) {
        console.log('Stderr (first 200 chars):', res.stderr.slice(0, 200));
      }
    } catch (err: any) {
      console.error(`FAILED ${s.name}:`, err.message || err);
    }
  }
}

runTests();
