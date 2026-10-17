import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { DockerRunner } from './src/runner/dockerRunner.js';
import executeRouter from './src/routes/execute.js';

const enabled = process.env.TEST_DOCKER === '1';
const runner = new DockerRunner();
const code = `#include <bits/stdc++.h>
using namespace std;
#define SHIFT(x) ((x) << 2)
template<class T> T twice(T x) {
  return x+x;
}
int main() {
  long long x = (1LL << 35);
  vector<long long> a{2, 4, 6};
  auto plus = [](long long n) { return n+1; };
  x = plus(x);
  cout << twice(SHIFT(a[0])) << ' ' << x;
  cerr << "{\\\"step\\\":999}";
  return 0;
}`;
test('GCC/GDB traces original macros/templates/lambdas/shifts/STL without parser', { skip: !enabled }, async () => {
  const original = await runner.run(code, '', { captureTrace: false });
  const traced = await runner.run(code, '', { captureTrace: true, debugTrace: true });
  assert.equal(traced.exitCode, 0, traced.stderr);
  assert.equal(traced.stdout, original.stdout);
  assert.equal(traced.stdout, '16 34359738369');
  assert.equal(traced.stderr, '{"step":999}');
  assert.equal(traced.trace.at(-1)?.stdout, traced.stdout);
  assert.deepEqual(traced.trace.at(-1)?.variables, {});
  assert.ok(traced.trace.length > 0);
  assert.ok(traced.trace.some(e => e.variables.x === 34359738369));
  assert.ok(traced.trace.some(e => JSON.stringify(e.variables.a) === '[2,4,6]'));
  assert.ok(traced.trace.every(e => e.line >= 1 && e.line <= code.split('\n').length));
  assert.ok(traced.trace.some(e => e.callStack.some(f => f.func.includes('twice'))));
});
test('visualize API sends original code to GCC and returns real trace', {skip: !enabled}, async () => {
  const previous = process.env.RUNNER;
  process.env.RUNNER = 'docker';
  const app = express(); app.use(express.json()); app.use('/execute', executeRouter);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const address = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${address.port}/execute`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({code, stdin:'', language:'cpp', mode:'visualize', standard:'gnu++17'})
    });
    const result = await response.json() as any;
    assert.equal(result.success, true, result.compilationError || result.runtimeError);
    assert.ok(result.trace.length > 0);
    assert.match(result.visualizationWarning, /GCC\/GDB/);
    assert.equal(result._instrumentedCode, undefined);
  } finally { server.close(); if (previous === undefined) delete process.env.RUNNER; else process.env.RUNNER = previous; }
});
test('debugger preserves GNU++20 compilation and stdin', {skip: !enabled}, async () => {
  const result = await runner.run(`#include <bits/stdc++.h>
using namespace std;
int main() {
 int n; cin >> n;
 vector<int> a{n,1};
 ranges::sort(a);
 cout << a.back();
}`, '7', {debugTrace:true, standard:'gnu++20'});
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stdout, '7');
  assert.ok(result.trace.length > 0);
});
test('debugger detects compiler errors, process failures and timeouts', {skip: !enabled}, async () => {
  await assert.rejects(runner.run('int main( {','',{debugTrace:true}), {name:'CompilationError'});
  const nonzero = await runner.run('int main(){return 7;}', '', {debugTrace:true});
  assert.equal(nonzero.exitCode,7,nonzero.stderr);
  const crash = await runner.run('int main(){int *p=nullptr; return *p;}', '', {debugTrace:true});
  assert.notEqual(crash.exitCode,0);
  assert.match(crash.stderr,/SIGSEGV/);
  const timeout = await runner.run('#include <unistd.h>\nint main(){sleep(3);}', '', {debugTrace:true,timeoutMs:1000});
  assert.equal(timeout.timeLimitExceeded,true,JSON.stringify(timeout));
});
test('debugger step limit stops repeated executed source lines', {skip: !enabled}, async () => {
  const result = await runner.run(`int main() {
 int n = 0;
 while (true) {
  n++;
 }
}`, '', {debugTrace:true,maxSteps:8});
  assert.equal(result.stepLimitExceeded,true);
  assert.equal(result.trace.length,8);
});

test('debugger reports oversized output rather than silently claiming success', {skip: !enabled}, async () => {
  const result = await runner.run('#include <iostream>\n#include <string>\nint main(){std::cout << std::string(1100000, \'x\');}', '', {debugTrace:true});
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /output exceeded/);
});

test('binary search trace visits every input iteration and follows only executed branches', {skip: !enabled}, async () => {
  const source = `#include <iostream>
using namespace std;
int main() {
 int n = 0;
 cin >> n;
 int arr[10] = {0};
 for (int i = 0; i < n; i++) {
  cin >> arr[i];
 }
 int target = 0;
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
  for (const [target, expected] of [[7, 3], [11, 5], [2, -1]]) {
    const result = await runner.run(source, `7\n1 3 5 7 9 11 13\n${target}`, {debugTrace:true});
    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(result.stepLimitExceeded, false);
    assert.equal(result.stdout.trim(), String(expected));
    const lines = result.trace.filter(e => e.event === 'line');
    assert.equal(lines.filter(e => e.line === 8).length, 7, 'all seven input reads must be recorded');
    assert.ok(lines.some(e => e.line === 25), 'must reach cout');
    assert.ok(lines.some(e => e.line === 26), 'must reach return');
    assert.equal(result.trace.at(-1)?.stdout?.trim(), String(expected));
    if (target === 7) {
      assert.ok(lines.some(e => e.line === 18), 'must reach break');
      assert.ok(!lines.some(e => e.line === 20 || e.line === 22), 'unselected branches must not be invented');
    } else if (target === 11) {
      assert.ok(lines.some(e => e.line === 20), 'right half search must be recorded');
    } else {
      assert.ok(lines.some(e => e.line === 22), 'left half search must be recorded');
    }
  }
});

test('recursive frames expose their own parameters, including waiting callers', {skip: !enabled}, async () => {
  const result = await runner.run(`#include <iostream>
int factorial(int n) {
 if (n <= 1) return 1;
 return n * factorial(n - 1);
}
int main() {
 std::cout << factorial(5);
 return 0;
}`, '', {debugTrace:true});
  assert.equal(result.exitCode,0,result.stderr);
  assert.equal(result.stdout,'120');
  const deepest = result.trace.find(e => e.callStack.filter(f=>f.func.includes('factorial')).length === 5);
  assert.ok(deepest,'all recursive frames must be observed');
  assert.deepEqual(deepest.callStack.filter(f=>f.func.includes('factorial')).map(f=>f.params?.n),[5,4,3,2,1]);
  assert.equal(deepest.variables.n,1);
  assert.ok(result.trace.some(e=>e.callStack.filter(f=>f.func.includes('factorial')).length === 1 && e.callStack.at(-1)?.params?.n === 5));
});

test('tiny programs exclude compiler scaffolding and comments do not create steps', {skip: !enabled}, async () => {
  const source = `#include <iostream>
int main() {
 int n = 0;
 std::cin >> n;
 std::cout << n + 1;
 return 0;
}`;
  for (const prefix of ['', '// comment without executable code\n'.repeat(800)]) {
    const result = await runner.run(prefix + source, '2', {debugTrace:true});
    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(result.stdout, '3');
    assert.equal(result.timeLimitExceeded, false);
    assert.equal(result.stepLimitExceeded, false);
    const lines = result.trace.filter(e => e.event === 'line');
    assert.ok(lines.length > 0 && lines.length <= 10, `tiny program: ${lines.length} stops`);
    assert.ok(lines.every(e => e.callStack.length === 1 && e.callStack[0].func === 'main'), JSON.stringify(lines));
    console.log(`Tiny program (${prefix ? 800 : 0} comment lines): ${lines.length} source stops + final output`);
  }
});

test('repeated loop visits remain visible even with unchanged observed variables', {skip: !enabled}, async () => {
  const result = await runner.run(`#include <iostream>
int main() {
 int n = 0;
 std::cin >> n;
 for (int i = 0; i < n; ++i) {
  std::cout << "x";
 }
 return 0;
}`, '3', {debugTrace:true});
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stdout, 'xxx');
  assert.equal(result.trace.filter(e => e.event === 'line' && e.line === 6).length, 3);
});
