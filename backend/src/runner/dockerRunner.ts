import { randomUUID } from 'node:crypto';
import { execFile } from 'child_process';
import { Runner, RunResult, RunLimits } from './sandbox.js';
import { TraceEvent } from '../routes/execute.js';

export class DockerRunner implements Runner {
  async run(instrumentedCode: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult> {
    const defaultLimits: RunLimits = {
      timeoutMs: 5000,
      maxOutputBytes: 10 * 1024 * 1024,
      maxSteps: 10000
    };
    const currentLimits = { ...defaultLimits, ...limits };
    const startTime = Date.now();

    return await new Promise<RunResult>((resolve, reject) => {
      // The docker container will read a JSON payload containing 'code' and 'stdin'
      const payload = JSON.stringify({ code: instrumentedCode, stdin: stdin || '', standard: currentLimits.standard || 'gnu++17', timeoutMs: currentLimits.timeoutMs });

      // Calculate a conservative memory and CPU limit based on Node.js constraints
      // Adding a buffer of a few seconds to docker timeout so the inner timeout triggers first
      const dockerTimeoutMs = currentLimits.timeoutMs + 27000;

      const containerName = `codelens-${randomUUID()}`;
      const args = [
        'run', '-i', '--rm', '--name', containerName,
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
        '--pids-limit', '64', '--read-only',
        '--tmpfs', '/sandbox:rw,exec,nosuid,size=128m,mode=1777',
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m,mode=1777',
        '--network', 'none', // Critical: no network access
        '--memory', '256m', // Limit memory
        '--cpus', '1.0', // Limit CPU
        'codelens-sandbox'
      ];

      const child = execFile('docker', args, {
        timeout: dockerTimeoutMs,
        maxBuffer: currentLimits.maxOutputBytes,
        windowsHide: true,
      }, (error: any, stdout, stderr) => {
        const executionTimeMs = Date.now() - startTime;
        let timeLimitExceeded = false;
        let exitCode = error ? error.code || 1 : 0;

        if (error?.killed || error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
          // Killing docker CLI alone does not stop its container.
          execFile('docker', ['rm', '-f', containerName], { timeout: 5000 }, () => {});
          timeLimitExceeded = !!error.killed;
        }
        if (exitCode === 124) timeLimitExceeded = true;

        // If the container failed to start (e.g. image not found)
        if (stderr && stderr.includes('Cannot connect to the Docker daemon')) {
           reject(new Error('Docker daemon is not running on the host.'));
           return;
        }
        if (stderr && stderr.includes('Unable to find image')) {
           reject(new Error('codelens-sandbox image not found. Please build it first.'));
           return;
        }

        // The bash script inside Docker outputs a JSON object if there is a compilation error
        try {
           const parsedStdout = JSON.parse(stdout);
           if (exitCode === 65 && typeof parsedStdout.compilationError === 'string') {
             const compErr: any = new Error(`Compilation failed:\n${parsedStdout.compilationError || 'Compiler stopped before producing diagnostics (check time/memory limits).'}`);
             compErr.name = 'CompilationError';
             reject(compErr);
             return;
           }
        } catch (e) {
           // Not a JSON object on stdout, means it successfully compiled and stdout is actual program stdout
        }

        // Parse stderr for trace events exactly like LocalRunner
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
        child.stdin.write(payload);
        child.stdin.end();
      }
    });
  }
}
