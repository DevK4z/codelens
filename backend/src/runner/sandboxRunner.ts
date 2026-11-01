import { spawn } from 'node:child_process';
import { chmod, chown, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Runner, RunResult, RunLimits } from './sandbox.js';
import { readRunOutput } from './output.js';

// For hosts that cannot start a container per run (Render has no Docker-in-Docker): the service
// container is the outer boundary, and runner/jail.c isolates each run inside it. See runner/jail.c.
const JAIL = '/usr/local/bin/codelens-jail';
const RUN = '/usr/local/bin/codelens-run';
const MEMORY_MB = Number(process.env.SANDBOX_MEMORY_MB || 512);
// GDB stepping on a 0.1 CPU share (Render free) needs more than the default 5s; run.sh caps it at 20s.
const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS || 5000);
// 0711: a run can enter its own directory but cannot list the others' names.
const RUNS_DIR = join(tmpdir(), 'codelens-runs');

// One uid per concurrent run; the jail only accepts 20000-29999.
const freeUids = Array.from({ length: 64 }, (_, i) => 20000 + i);

// A run can leave its process group (setsid, double fork), so sweep by uid until nothing is left.
async function killUid(uid: number) {
  for (let round = 0; round < 5; round++) {
    let found = false;
    for (const pid of await readdir('/proc').catch(() => [] as string[])) {
      if (!/^\d+$/.test(pid)) continue;
      const status = await readFile(`/proc/${pid}/status`, 'utf8').catch(() => '');
      // Zombies are already dead; tini (PID 1) reaps them.
      if (Number(/^Uid:\s+(\d+)/m.exec(status)?.[1]) !== uid || /^State:\s+Z/m.test(status)) continue;
      found = true;
      try { process.kill(Number(pid), 'SIGKILL'); } catch { /* Already gone. */ }
    }
    if (!found) return;
  }
}

interface Jailed { code: number; stdout: string; stderr: string; killed: boolean; overflow: boolean }

async function jailed(program: string[], input: string, timeoutMs: number, maxBytes: number): Promise<Jailed> {
  const uid = freeUids.shift();
  if (uid === undefined) throw new Error('Không còn uid trống cho sandbox.');
  await mkdir(RUNS_DIR, { recursive: true });
  await chmod(RUNS_DIR, 0o711);
  const dir = await mkdtemp(join(RUNS_DIR, 'run-'));
  try {
    // mkdtemp creates the directory 0700, so only this run's uid can enter it.
    await chown(dir, uid, uid);
    return await new Promise<Jailed>((resolve, reject) => {
      const child = spawn(JAIL, [String(uid), String(MEMORY_MB), dir, ...program], { env: {}, stdio: 'pipe' });
      const out: Buffer[] = [], err: Buffer[] = [];
      let bytes = 0, killed = false, overflow = false;
      const stop = () => { child.kill('SIGKILL'); void killUid(uid); };
      const collect = (into: Buffer[]) => (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes) { overflow = true; stop(); return; }
        into.push(chunk);
      };
      child.stdout.on('data', collect(out));
      child.stderr.on('data', collect(err));
      const timer = setTimeout(() => { killed = true; stop(); }, timeoutMs);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      // Like a container ending with its entrypoint: once run.sh exits, anything it left behind
      // dies too, which also releases the stdout/stderr pipes a background process would hold open.
      child.on('exit', () => { void killUid(uid); });
      child.on('close', code => {
        clearTimeout(timer);
        resolve({ code: code ?? 1, stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8'), killed, overflow });
      });
      child.stdin.on('error', () => {});
      child.stdin.end(input);
    });
  } finally {
    await killUid(uid);
    await rm(dir, { recursive: true, force: true });
    freeUids.push(uid);
  }
}

// The jail exits 125 with a "codelens-jail:" message when it could not isolate the run.
function assertIsolated(result: Jailed) {
  if (result.code === 125 && result.stderr.startsWith('codelens-jail:'))
    throw new Error(`Sandbox không cô lập được lần chạy nên đã dừng: ${result.stderr.trim()}`);
}

export class SandboxRunner implements Runner {
  async run(code: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult> {
    const current: RunLimits = { timeoutMs: RUN_TIMEOUT_MS, maxOutputBytes: 10 * 1024 * 1024, maxSteps: 10000, ...limits };
    const payload = JSON.stringify({ code, stdin: stdin || '', standard: current.standard || 'gnu++17', timeoutMs: current.timeoutMs,
      debugTrace: !!current.debugTrace, maxSteps: Math.min(current.maxSteps, 2000) });
    const started = Date.now();
    // run.sh bounds compilation (25s) and execution itself; this outer limit only catches a stuck run.
    const result = await jailed([RUN], payload, current.timeoutMs + 30000, current.maxOutputBytes);
    assertIsolated(result);
    return readRunOutput({
      exitCode: result.overflow ? 1 : result.code,
      stdout: result.stdout,
      stderr: result.overflow ? `${result.stderr}\nOutput vượt giới hạn ${current.maxOutputBytes} byte.` : result.stderr,
      timeLimitExceeded: result.killed,
      executionTimeMs: Date.now() - started,
      debugTrace: !!current.debugTrace,
      captureTrace: current.captureTrace !== false,
      missingDebuggerMessage: 'Sandbox chưa có GCC/GDB. Kiểm tra image Render.',
    });
  }
}

let verified: Promise<void> | undefined;

// Proves on the real host that a jailed process gets its own uid and cannot open a network socket.
// Health reports 503 until this passes, so a platform that silently ignores seccomp or setuid
// never serves submissions. A success is cached; a failure is retried on the next check.
export function verifySandbox(): Promise<void> {
  verified ??= (async () => {
    const probe = 'import os, socket\nassert os.getuid() >= 20000, os.getuid()\ntry:\n    socket.socket()\nexcept PermissionError:\n    print("isolated")\n';
    const result = await jailed(['/usr/bin/python3', '-c', probe], '', 15000, 64 * 1024);
    assertIsolated(result);
    if (result.code !== 0 || result.stdout.trim() !== 'isolated')
      throw new Error(`Sandbox chưa cô lập mạng hoặc uid (exit ${result.code}): ${(result.stderr || result.stdout).trim().slice(0, 300)}`);
  })().catch(error => { verified = undefined; throw error; });
  return verified;
}
