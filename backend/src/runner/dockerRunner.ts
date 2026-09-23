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
      const payload = JSON.stringify({ code: instrumentedCode, stdin: stdin || '' });

      // Calculate a conservative memory and CPU limit based on Node.js constraints
      // Adding a buffer of a few seconds to docker timeout so the inner timeout triggers first
      const dockerTimeoutMs = currentLimits.timeoutMs + 2000;

      const args = [
        'run', '-i', '--rm',
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

        if (error && error.killed && error.signal === 'SIGTERM') {
          timeLimitExceeded = true;
        }

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
           if (parsedStdout.compilationError) {
             const compErr: any = new Error(`Compilation failed:\n${parsedStdout.compilationError}`);
             compErr.name = 'CompilationError';
             reject(compErr);
             return;
           }
        } catch (e) {
           // Not a JSON object on stdout, means it successfully compiled and stdout is actual program stdout
        }

        // Parse stderr for trace events exactly like LocalRunner
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
        child.stdin.write(payload);
        child.stdin.end();
      }
    });
  }
}
