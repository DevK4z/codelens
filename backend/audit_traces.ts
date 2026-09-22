import { tokenize } from './src/engine/lexer';
import { parse } from './src/engine/parser';
import { instrument } from './src/engine/instrumenter';
import { runCode } from './src/runner/local';

const code = `#include <iostream>
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
}`;

async function run() {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  const inst = instrument(ast, code);
  const res = await runCode(inst, '7\n1 3 5 7 9 11 13\n7\n');
  
  console.log("=== BINARY SEARCH TRACE AUDIT ===");
  for (const step of res.trace) {
    const v = step.variables;
    const mid = v.mid !== undefined ? v.mid : '-';
    const left = v.left !== undefined ? v.left : '-';
    const right = v.right !== undefined ? v.right : '-';
    const result = v.result !== undefined ? v.result : '-';
    console.log(`Step ${step.step} | line ${step.line} | ${step.event} | mid=${mid} left=${left} right=${right} result=${result}`);
    if (step.compareInfo) {
      console.log(`  >> ${step.compareInfo.left}(${step.compareInfo.leftValue}) ${step.compareInfo.operator} ${step.compareInfo.right}(${step.compareInfo.rightValue}) => ${step.compareInfo.result}`);
    }
  }
  console.log(`\nTotal steps: ${res.trace.length}, stdout: ${JSON.stringify(res.stdout)}`);

  // Now test factorial trace for return values
  console.log("\n=== FACTORIAL TRACE AUDIT ===");
  const fcode = `#include <iostream>
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
}`;
  const ftokens = tokenize(fcode);
  const fast = parse(ftokens);
  const finst = instrument(fast, fcode);
  const fres = await runCode(finst, '5\n');
  for (const step of fres.trace) {
    const stackStr = step.callStack.map((f: any) => f.func).join(' > ');
    console.log(`Step ${step.step} | line ${step.line} | ${step.event} | stack: [${stackStr}] | n=${step.variables.n} result=${step.variables.result !== undefined ? step.variables.result : '-'}`);
  }
  console.log(`\nTotal steps: ${fres.trace.length}, stdout: ${JSON.stringify(fres.stdout)}`);
}
run().catch(console.error);

