import { Runner } from './sandbox.js';
import { DockerRunner } from './dockerRunner.js';
import { SandboxRunner } from './sandboxRunner.js';
import { LocalRunner } from './local.js';

// docker: a fresh container per run (VPS or own machine with a Docker daemon).
// sandbox: jailed processes inside the service container (Render and other hosts without Docker-in-Docker).
// local: unisolated, loopback-only development.
export type RunnerKind = 'docker' | 'sandbox' | 'local';

export function runnerKind(): RunnerKind {
  const requested = process.env.RUNNER;
  if (requested === 'docker' || requested === 'sandbox') return requested;
  return process.env.NODE_ENV === 'production' ? 'docker' : 'local';
}

export function createRunner(kind: RunnerKind): Runner {
  return kind === 'docker' ? new DockerRunner() : kind === 'sandbox' ? new SandboxRunner() : new LocalRunner();
}
