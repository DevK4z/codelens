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
  return res.json() as Promise<{ status: string; stdout: string; error: string | null; trace: unknown[] }>;
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
