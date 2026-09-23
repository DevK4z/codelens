import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { Runner, RunResult, RunLimits } from './sandbox.js';
import { TraceEvent } from '../routes/execute.js';

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

    const codeFile = path.join(tempDir, 'code.cpp');
    const exeFile = path.join(tempDir, process.platform === 'win32' ? 'code.exe' : 'code');

    try {
      fs.writeFileSync(codeFile, instrumentedCode);

      // Compile
      await new Promise<void>((resolve, reject) => {
        execFile('g++', ['-std=c++17', '-O0', '-g', '-o', exeFile, codeFile], { windowsHide: true, timeout: 15000, maxBuffer: currentLimits.maxOutputBytes }, (error, stdout, stderr) => {
          if (error) {
            const err: any = new Error(`Compilation failed:\n${stderr}`);
            err.name = 'CompilationError';
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Run
      const startTime = Date.now();
      return await new Promise<RunResult>((resolve) => {
        const child = execFile(exeFile, [], {
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

          const lines = stderr.split('\n');
          const trace: TraceEvent[] = [];
          let actualStderr = '';
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

