import test from 'node:test';
import assert from 'node:assert/strict';

// Runs against a container built from backend/Dockerfile, started without extra privileges the
// way Render runs it: SANDBOX_API_URL=http://127.0.0.1:10000 npm run test:render
const base = process.env.SANDBOX_API_URL;
const skip = !base && 'set SANDBOX_API_URL to a running backend/Dockerfile container';

async function run(code: string, mode: 'run' | 'visualize' = 'run', stdin = '') {
  const res = await fetch(`${base}/api/v1/runs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'cpp', mode, stdin, code }),
  });
  assert.equal(res.status, 201, await res.clone().text());
  return res.json() as Promise<{ status: string; stdout: string; error: string | null; trace: any[] }>;
}

test('health proves the jail works on this host', { skip }, async () => {
  const res = await fetch(`${base}/api/v1/health`);
  assert.equal(res.status, 200, await res.clone().text());
  assert.deepEqual(await res.json(), { status: 'ok', runner: 'sandbox' });
});

test('runs and GDB visualization work inside the jail', { skip }, async () => {
  const native = await run('#include <bits/stdc++.h>\nusing namespace std;\nint main(){int n;cin>>n;cout<<n*n;}', 'run', '12');
  assert.equal(native.status, 'succeeded', native.error ?? '');
  assert.equal(native.stdout, '144');
  const traced = await run('#include <iostream>\nint main(){\n  int a[] = {3, 1, 2};\n  int s = 0;\n  for (int x : a) s += x;\n  std::cout << s;\n}\n', 'visualize');
  assert.equal(traced.status, 'succeeded', traced.error ?? '');
  assert.equal(traced.stdout, '6');
  assert.ok(traced.trace.length > 0);
});

test('a submission cannot reach the network, the service or other runs', { skip }, async () => {
  const probe = await run(`#include <cstdio>
#include <cstdlib>
#include <fcntl.h>
#include <sys/socket.h>
#include <unistd.h>
int main(){
  printf("uid=%d ", getuid() >= 20000);
  printf("inet=%d ", socket(AF_INET, SOCK_STREAM, 0) >= 0);
  printf("inet6=%d ", socket(AF_INET6, SOCK_DGRAM, 0) >= 0);
  printf("unix=%d ", socket(AF_UNIX, SOCK_STREAM, 0) >= 0);
  printf("env=%d ", getenv("RUNNER") || getenv("NODE_ENV") || getenv("CORS_ORIGINS"));
  printf("service_env=%d ", open("/proc/1/environ", O_RDONLY) >= 0);
  printf("write_app=%d ", open("/app/pwned", O_CREAT | O_WRONLY, 0644) >= 0);
  printf("list_runs=%d", open("/tmp/codelens-runs", O_RDONLY | O_DIRECTORY) >= 0);
}`);
  assert.equal(probe.status, 'succeeded', probe.error ?? '');
  assert.equal(probe.stdout, 'uid=1 inet=0 inet6=0 unix=1 env=0 service_env=0 write_app=0 list_runs=0');
});

test('fork bombs, memory hogs and endless loops are contained', { skip }, async () => {
  const forks = await run(`#include <cstdio>
#include <sys/wait.h>
#include <unistd.h>
int main(){ int n = 0; for (int i = 0; i < 500; i++) { pid_t p = fork(); if (p == 0) { sleep(1); _exit(0); } if (p < 0) break; n++; } while (wait(nullptr) > 0) {} printf("%d", n); }`);
  assert.ok(Number(forks.stdout) < 64, forks.stdout);

  const memory = await run('#include <cstdio>\n#include <new>\n#include <vector>\nint main(){ try { std::vector<char> v(size_t(2000) << 20); v[0] = 1; printf("allocated"); } catch (const std::bad_alloc&) { printf("refused"); } }');
  assert.equal(memory.stdout, 'refused');

  const loop = await run('int main(){ for (;;) {} }');
  assert.equal(loop.status, 'time_limit_exceeded');
});

test('background processes are cleaned up and never hold the request open', { skip }, async () => {
  const started = Date.now();
  const daemon = await run('#include <cstdio>\n#include <unistd.h>\nint main(){ if (fork() == 0) { setsid(); if (fork() == 0) { sleep(120); return 0; } return 0; } printf("spawned"); }');
  assert.equal(daemon.status, 'succeeded', daemon.error ?? '');
  assert.ok(Date.now() - started < 15000, 'request returned without waiting for the daemon');
  const check = await run('#include <cstdio>\n#include <dirent.h>\n#include <cstdlib>\nint main(){ int n = 0; DIR *d = opendir("/proc"); while (dirent *e = readdir(d)) if (atoi(e->d_name) > 0) n++; printf("%d", n); }');
  // Only tini, node and this run's own short process chain should exist.
  assert.ok(Number(check.stdout) < 10, `processes visible: ${check.stdout}`);
});

test('linked structures are read from memory, and bad pointers cannot break a trace', { skip }, async () => {
  const list = await run(`#include <iostream>
struct Node { int value; Node *next; };
int main() {
  Node *head = nullptr;
  for (int i = 3; i > 0; i--)
    head = new Node{i, head};
  std::cout << head->value;
  return 0;
}`, 'visualize');
  assert.equal(list.status, 'succeeded', list.error ?? '');
  const heap = list.trace.filter(e => e.heap).at(-1).heap;
  assert.deepEqual(Object.values(heap).map((n: any) => n.fields.value), [1, 2, 3]);

  const hostile = await run(`#include <cstdio>
struct Node { int value; Node *next; };
int main() {
  Node *wild = reinterpret_cast<Node *>(0x1234560);
  Node *odd = reinterpret_cast<Node *>(0x7ffe00000003);
  Node loop{1, nullptr};
  loop.next = &loop;
  Node *head = nullptr;
  for (int i = 0; i < 100; i++)
    head = new Node{i, head};
  printf("%d %d", wild == odd, head->value);
  return 0;
}`, 'visualize');
  assert.equal(hostile.status, 'succeeded', hostile.error ?? '');
  assert.equal(hostile.stdout, '0 99');
  const sizes = hostile.trace.filter(e => e.heap).map(e => Object.keys(e.heap).length);
  assert.ok(Math.max(...sizes) <= 64, `read at most 64 nodes, got ${Math.max(...sizes)}`);
  assert.ok(!hostile.trace.some(e => e.heap?.['0x1234560']), 'an unmapped address is skipped');

  const strings = await run(`#include <bits/stdc++.h>
using namespace std;
int main() {
  map<string, int> m = {{"a", 1}};
  vector<string> v = {"x"};
  cout << m.size();
  return 0;
}
`, 'visualize');
  const main = strings.trace.find(e => e.line === 6);
  assert.deepEqual([main.variables.m, main.variables.v], [{ a: 1 }, ['x']]);
});

test('every loop check and every round of a one-line loop is a step', { skip }, async () => {
  const blocks = await run(`#include <iostream>
int main() {
  int s = 0;
  for (int i = 0; i < 2; i++) {
    s += i;
  }
  while (s > 0) {
    s--;
  }
  std::cout << s;
  return 0;
}
`, 'visualize');
  assert.deepEqual(blocks.trace.filter(e => e.event === 'line' && e.line === 4).map(e => e.variables.i), [null, 0, 1], 'start, then back at the header with i readable');
  assert.equal(blocks.trace.filter(e => e.line === 7).length, 2, 'the condition is checked again and ends the loop');

  const inline = await run(`#include <iostream>
int main() {
  int f[5];
  f[0] = 0; f[1] = 1;
  for (int i = 2; i < 5; i++) f[i] = f[i - 1] + f[i - 2];
  std::cout << f[4];
  return 0;
}
`, 'visualize');
  assert.equal(inline.stdout, '3');
  const rounds = inline.trace.filter(e => e.line === 5 && typeof e.variables.i === 'number');
  assert.deepEqual(rounds.map(e => e.variables.i), [2, 3, 4]);
  assert.deepEqual(rounds.map(e => e.variables.f.slice(0, e.variables.i)), [[0, 1], [0, 1, 1], [0, 1, 1, 2]], 'one cell per round');
});
