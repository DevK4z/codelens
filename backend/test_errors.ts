import { tokenize } from './src/engine/lexer';
import { parse } from './src/engine/parser';
import { instrument } from './src/engine/instrumenter';
import { runCode } from './src/runner/local';

async function testErrors() {
  console.log('=== TESTING ERROR HANDLING ===');

  // 1. Unsupported syntax (e.g. class)
  try {
    const code = `class MyClass { int x; }; int main() { return 0; }`;
    const tokens = tokenize(code);
    parse(tokens);
    console.log('Class error test: FAILED (should have thrown ParseError)');
  } catch (err: any) {
    console.log('Class error caught:', err.name, '->', err.message);
  }

  // 2. Syntax error in C++
  try {
    const code = `int main() { int a = ; return 0; }`;
    const tokens = tokenize(code);
    parse(tokens);
    console.log('Syntax error test: FAILED (should have thrown ParseError)');
  } catch (err: any) {
    console.log('Syntax error caught:', err.name, '->', err.message);
  }

  // 3. Infinite loop (timeout handling)
  try {
    const code = `#include <iostream>
using namespace std;
int main() {
    int i = 0;
    while (i < 1000000) {
        i = i;
    }
    return 0;
}`;
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const inst = instrument(ast, code);
    const res = await runCode(inst, '', { timeoutMs: 2000 });
    console.log('Infinite loop result: stepLimitExceeded =', res.stepLimitExceeded, 'timeLimitExceeded =', res.timeLimitExceeded, 'steps =', res.trace.length);
  } catch (err: any) {
    console.log('Infinite loop error caught:', err.message);
  }
}

testErrors();
