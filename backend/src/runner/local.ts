import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { Runner, RunResult, RunLimits } from './sandbox.js';
import { TraceEvent } from '../types.js';
import { JAVA_FLAGS, NODE_FLAGS, type Language } from './languages.js';

interface LocalPlan { file: string; compile: [string, string[]] | null; run: [string, string[]] }

// Compile and run commands per language, all inside the run's own temp directory.
function plan(language: Language, dir: string, standard: string): LocalPlan {
  const exe = path.join(dir, process.platform === 'win32' ? 'code.exe' : 'code');
  switch (language) {
    case 'c': {
      const file = path.join(dir, 'code.c');
      return { file, compile: ['gcc', ['-std=gnu17', '-O2', '-o', exe, file, '-lm']], run: [exe, []] };
    }
    case 'python': {
      const file = path.join(dir, 'code.py');
      return { file, compile: ['python3', ['-m', 'py_compile', file]], run: ['python3', [file]] };
    }
    case 'javascript': {
      const file = path.join(dir, 'code.js');
      return { file, compile: ['node', ['--check', file]], run: ['node', [...NODE_FLAGS, file]] };
    }
    case 'java': {
      const file = path.join(dir, 'Main.java');
      return { file, compile: ['javac', ['-encoding', 'UTF-8', '-d', dir, file]], run: ['java', [...JAVA_FLAGS, '-cp', dir, 'Main']] };
    }
    default: {
      const file = path.join(dir, 'code.cpp');
      return { file, compile: ['g++', [`-std=${standard}`, '-O0', '-g', '-o', exe, file]], run: [exe, []] };
    }
  }
}

export class LocalRunner implements Runner {
  async run(instrumentedCode: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult> {
    const defaultLimits: RunLimits = {
      timeoutMs: 5000,
      maxOutputBytes: 10 * 1024 * 1024,
      maxSteps: 10000
    };
    const currentLimits = { ...defaultLimits, ...limits };

    const tempDir = path.join(os.tmpdir(), uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });

    const steps = plan(currentLimits.language ?? 'cpp', tempDir, currentLimits.standard || 'gnu++17');

    try {
      fs.writeFileSync(steps.file, instrumentedCode);

      // Compile (or syntax-check for interpreted languages)
      if (steps.compile) {
        const [command, args] = steps.compile;
        await new Promise<void>((resolve, reject) => {
          execFile(command, args, { cwd: tempDir, windowsHide: true, timeout: 15000, maxBuffer: currentLimits.maxOutputBytes }, (error, stdout, stderr) => {
            if (error) {
              const err: any = new Error(`Compilation failed:\n${stderr || stdout || error.message}`);
              err.name = 'CompilationError';
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      // Run
      const startTime = Date.now();
      return await new Promise<RunResult>((resolve) => {
        const child = execFile(steps.run[0], steps.run[1], {
          cwd: tempDir,
          timeout: currentLimits.timeoutMs,
          maxBuffer: currentLimits.maxOutputBytes,
          windowsHide: true,
        }, (error: any, stdout, stderr) => {
          const executionTimeMs = Date.now() - startTime;
          let timeLimitExceeded = false;
          let exitCode = error ? error.code || 1 : 0;

          if (error && error.killed && error.signal === 'SIGTERM') {
             timeLimitExceeded = true;
          }

          const lines = currentLimits.captureTrace === false ? [] : stderr.split('\n');
          const trace: TraceEvent[] = [];
          let actualStderr = currentLimits.captureTrace === false ? stderr : '';
          let stepLimitExceeded = false;

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              if (event.error === 'STEP_LIMIT') {
                stepLimitExceeded = true;
              } else if (event.step !== undefined) {
                trace.push(event);
              } else {
                actualStderr += line + '\n';
              }
            } catch (e) {
              actualStderr += line + '\n';
            }
          }

          resolve({
            trace,
            stdout,
            stderr: actualStderr,
            exitCode,
            executionTimeMs,
            timeLimitExceeded,
            stepLimitExceeded
          });
        });

        if (child.stdin) {
          child.stdin.on('error', () => {});
          child.stdin.write(stdin || '');
          child.stdin.end();
        }
      });
    } finally {
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup temp dir:', tempDir, e);
      }
    }
  }
}

export async function runCode(code: string, stdin: string): Promise<RunResult> {
  const runner = new LocalRunner();
  return await runner.run(code, stdin);
}

