import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';

// Judges the same task in every supported language through LocalRunner (loopback). A language whose
// toolchain is missing on this machine is skipped, not failed.
process.env.RUNNER = 'local';
process.env.JUDGE_TIMEOUT_MS = '5000';
process.env.RATE_LIMIT_PER_MIN = '100';
const { createApp } = await import('./src/app.js');
const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
test.after(() => { server.closeAllConnections(); server.close(); });

const judge = (body: unknown) =>
  fetch(`${base}/api/v1/judge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const has = (command: string, ...args: string[]) => spawnSync(command, args).status === 0;

// Sum of the n numbers after n; the last case needs 64-bit arithmetic.
const tests = [
  { stdin: '3\n1 2 3\n', expected: '6' },
  { stdin: '2\n-5 5', expected: '0' },
  { stdin: '2\n3000000000 3000000000\n', expected: '6000000000' },
  { stdin: '1\n7\n', expected: '8' },
];
const verdicts = ['accepted', 'accepted', 'accepted', 'wrong_answer'];

const programs: { language: string; available: boolean; code: string; broken: string }[] = [
  { language: 'c', available: has('gcc', '--version'),
    code: '#include <stdio.h>\nint main(void){int n;long long s=0,x;scanf("%d",&n);while(n--){scanf("%lld",&x);s+=x;}printf("%lld\\n",s);return 0;}\n',
    broken: 'int main(void){ return 0 }' },
  { language: 'python', available: has('python3', '--version'),
    code: 'import sys\ndata = sys.stdin.read().split()\nn = int(data[0])\nprint(sum(map(int, data[1:1 + n])))\n',
    broken: 'def f(:\n  pass\n' },
  { language: 'javascript', available: has('node', '--version'),
    code: "const d = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(BigInt);\nconst n = Number(d[0]);\nlet s = 0n;\nfor (let i = 1; i <= n; i++) s += d[i];\nconsole.log(s.toString());\n",
    broken: 'const = 1;' },
  { language: 'java', available: has('javac', '-version') && has('java', '-version'),
    code: 'import java.util.*;\npublic class Main {\n  public static void main(String[] a) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt(); long s = 0;\n    for (int i = 0; i < n; i++) s += sc.nextLong();\n    System.out.println(s);\n  }\n}\n',
    broken: 'public class Main { public static void main(String[] a) { int x = } }' },
];

for (const p of programs) {
  test(`${p.language}: grades every test case`, { skip: !p.available && `${p.language} toolchain not installed` }, async () => {
    const res = await judge({ language: p.language, code: p.code, tests });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'completed', body.error ?? '');
    assert.deepEqual(body.tests.map((t: { verdict: string }) => t.verdict), verdicts, JSON.stringify(body.tests));
  });

  test(`${p.language}: syntax errors are reported as compile errors`, { skip: !p.available && `${p.language} toolchain not installed` }, async () => {
    const body = await (await judge({ language: p.language, code: p.broken, tests: [{ stdin: '', expected: '' }] })).json();
    assert.equal(body.status, 'compile_error');
    assert.ok(body.error.length > 0);
  });
}

test('python runtime errors are runtime_error, not compile errors', { skip: !has('python3', '--version') && 'python3 missing' }, async () => {
  const body = await (await judge({ language: 'python', code: 'print(1 // 0)\n', tests: [{ stdin: '', expected: '1' }] })).json();
  assert.equal(body.status, 'completed');
  assert.equal(body.tests[0].verdict, 'runtime_error');
  assert.match(body.tests[0].stderr, /ZeroDivisionError/);
});

test('unknown languages are rejected', async () => {
  const res = await judge({ language: 'ruby', code: 'puts 1', tests: [{ stdin: '' }] });
  assert.equal(res.status, 422);
  assert.match((await res.json()).detail, /cpp, c, python, java, javascript/);
});
