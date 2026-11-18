import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmod, chown, copyFile, lstat, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
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

// A run can leave its process group (setsid, double fork), so end everything its uid owns. The jail
// does the signalling as that uid: Render's containers lack CAP_KILL, so root's own kill() is refused.
function killUid(uid: number): Promise<void> {
  return new Promise(resolve => {
    const killer = spawn(JAIL, ['--kill', String(uid)], { env: {}, stdio: 'ignore' });
    killer.on('error', () => resolve());
    killer.on('close', () => resolve());
  });
}

export interface Jailed { code: number; stdout: string; stderr: string; killed: boolean; overflow: boolean }
// `prepare` places files into the run directory (owned by the run's uid) before the jail starts.
type Prepare = (dir: string, uid: number) => Promise<void>;

async function jailed(program: string[], input: string, timeoutMs: number, maxBytes: number, prepare?: Prepare): Promise<Jailed> {
  const uid = freeUids.shift();
  if (uid === undefined) throw new Error('Không còn uid trống cho sandbox.');
  await mkdir(RUNS_DIR, { recursive: true });
  await chmod(RUNS_DIR, 0o711);
  const dir = await mkdtemp(join(RUNS_DIR, 'run-'));
  try {
    // mkdtemp creates the directory 0700, so only this run's uid can enter it.
    await chown(dir, uid, uid);
    await prepare?.(dir, uid);
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

// Programs compiled earlier, keyed by standard and source, so running the same code with new input
// skips compilation (1.5-5s on a 0.1 CPU share). run.sh hands over the binary at the start of its
// output, right after g++ and before the program runs, so the program cannot change what is stored.
// The cache is root-only and each run gets its own copy.
const BUILDS_DIR = join(tmpdir(), `codelens-builds-${process.pid}`);
const MAX_BUILDS = 64;
// Room for the base64 binary (run.sh emits at most 8 MiB, i.e. under 12 MiB encoded).
const EMIT_ALLOWANCE = 12 * 1024 * 1024;
const builds = new Map<string, string>();

async function storeBuild(key: string, binary: Buffer): Promise<string> {
  await mkdir(BUILDS_DIR, { recursive: true, mode: 0o700 });
  const target = join(BUILDS_DIR, key), temp = `${target}.${randomUUID()}`;
  await writeFile(temp, binary);
  await chmod(temp, 0o500);
  await rename(temp, target);
  builds.delete(key);
  builds.set(key, target);
  for (const [old, path] of builds) {
    if (builds.size <= MAX_BUILDS) break;
    builds.delete(old);
    await rm(path, { force: true });
  }
  return target;
}

async function placeBuild(build: string, dir: string, uid: number) {
  const target = join(dir, 'code');
  await copyFile(build, target);
  await chown(target, uid, uid);
  await chmod(target, 0o700);
}

// Identical requests for programs whose behaviour cannot vary between runs get the recorded result.
// Anything that reads the clock, randomness or the process id is always run again.
const NONDETERMINISTIC = /\b(?:time|clock|rand|srand|random_device|mt19937(?:_64)?|default_random_engine|\w+_distribution|chrono|getpid|shuffle|random_shuffle)\b/;
const MAX_RESULTS = 32;
const results = new Map<string, RunResult>();

function remember(key: string, result: RunResult) {
  results.delete(key);
  results.set(key, structuredClone(result));
  for (const old of results.keys()) {
    if (results.size <= MAX_RESULTS) break;
    results.delete(old);
  }
}

// Splits off the "CODELENS-BUILD <length>" block run.sh wrote before the program started, stores it,
// and leaves the output and its limit exactly as if the block had never been there.
export function takeBuild(result: Jailed, maxBytes: number, store: (binary: Buffer) => Promise<unknown>): Jailed {
  const header = /^CODELENS-BUILD (\d+)\n/.exec(result.stdout);
  if (!header) return result;
  const start = header[0].length, length = Number(header[1]);
  // A block cut short means run.sh was stopped before the program could start.
  if (result.stdout[start + length] !== '\n') return { ...result, stdout: '' };
  store(Buffer.from(result.stdout.slice(start, start + length), 'base64')).catch(() => {});
  let stdout = result.stdout.slice(start + length + 1);
  const room = Math.max(0, maxBytes - Buffer.byteLength(result.stderr));
  const overflow = result.overflow || Buffer.byteLength(stdout) > room;
  if (overflow) stdout = Buffer.from(stdout).subarray(0, room).toString('utf8');
  return { ...result, stdout, overflow };
}

export class SandboxRunner implements Runner {
  async run(code: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult> {
    const current: RunLimits = { timeoutMs: RUN_TIMEOUT_MS, maxOutputBytes: 10 * 1024 * 1024, maxSteps: 10000, ...limits };
    const standard = current.standard || 'gnu++17';
    const request = { code, stdin: stdin || '', standard, timeoutMs: current.timeoutMs, debugTrace: !!current.debugTrace, maxSteps: Math.min(current.maxSteps, 2000) };
    const started = Date.now();
    const resultKey = createHash('sha256').update(JSON.stringify([request, current.captureTrace !== false, current.maxOutputBytes])).digest('hex');
    const cached = results.get(resultKey);
    if (cached) {
      remember(resultKey, cached);
      return { ...structuredClone(cached), executionTimeMs: Date.now() - started };
    }

    const buildKey = createHash('sha256').update(`${standard}\0${code}`).digest('hex');
    let build = builds.get(buildKey);
    if (build && !(await lstat(build).catch(() => undefined))) { builds.delete(buildKey); build = undefined; }
    // run.sh bounds compilation (25s) and execution itself; this outer limit only catches a stuck run.
    const result = build
      ? await jailed([RUN], JSON.stringify({ ...request, build: 'reuse' }), current.timeoutMs + 30000, current.maxOutputBytes, (dir, uid) => placeBuild(build!, dir, uid))
      : takeBuild(await jailed([RUN], JSON.stringify({ ...request, build: 'emit' }), current.timeoutMs + 30000, current.maxOutputBytes + EMIT_ALLOWANCE),
        current.maxOutputBytes, binary => storeBuild(buildKey, binary));
    assertIsolated(result);
    const output = this.output(result, current, started);
    if (!output.timeLimitExceeded && !result.overflow && !NONDETERMINISTIC.test(code)) remember(resultKey, output);
    return output;
  }

  private output(result: Jailed, current: RunLimits, started: number): RunResult {
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
