import express, { type Request } from 'express';
import cors from 'cors';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRunsRouter } from './routes/runs.js';
import { legacyExecute } from './routes/execute.js';
import { ApiError, methodNotAllowed, notFound, problemHandler } from './problem.js';
import { isDirectLocal, LOCAL_RUNNER_PUBLIC_ERROR, rateLimit } from './guard.js';

const execFileAsync = promisify(execFile);

async function checkHealth(req: Request) {
  const docker = process.env.NODE_ENV === 'production' || process.env.RUNNER === 'docker';
  if (docker) {
    try {
      // Both checks must use the same Docker daemon as DockerRunner.
      await execFileAsync('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 3000 });
      await execFileAsync('docker', ['image', 'inspect', 'codelens-sandbox'], { timeout: 3000 });
    } catch {
      throw new ApiError(503, 'runner_unavailable', 'Backend đã nhận kết nối nhưng Docker hoặc image codelens-sandbox chưa sẵn sàng.');
    }
  }
  // Fails the Pages deploy check instead of silently publishing an unsandboxed runner.
  if (!docker && !isDirectLocal(req)) throw new ApiError(503, 'local_runner_not_public', LOCAL_RUNNER_PUBLIC_ERROR);
  return { status: 'ok', runner: docker ? 'docker' : 'local' };
}

export function createApp() {
  const app = express();

  // Origins contain scheme and host, but no path such as /codelens/.
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://devk4z.github.io')
    .split(',').map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean);
  // The Pages frontend must be able to read where a created run lives and when to retry.
  app.use(cors({ origin: origins, exposedHeaders: ['Location', 'Retry-After'] }));
  app.use(express.json({ limit: '1mb' }));

  // One budget for both execute endpoints, so the deprecated alias cannot double a visitor's quota.
  const limiter = rateLimit(Number(process.env.RATE_LIMIT_PER_MIN || 20), 60_000);

  app.route('/api/v1/health')
    .get(async (req, res) => { res.set('Cache-Control', 'no-store').json(await checkHealth(req)); })
    .all(methodNotAllowed('GET'));
  app.use('/api/v1/runs', createRunsRouter(limiter));

  // Deprecated aliases with the pre-v1 response shapes; see routes/execute.ts.
  app.get('/api/health', async (req, res) => {
    res.set({ 'Cache-Control': 'no-store', Deprecation: 'true', Link: '</api/v1/health>; rel="successor-version"' });
    try { res.json(await checkHealth(req)); }
    catch (error) {
      if (!(error instanceof ApiError)) throw error;
      res.status(error.status).json({ status: 'unavailable', error: error.message });
    }
  });
  app.post('/api/execute', limiter, legacyExecute);

  app.use('/api', notFound);
  app.use(problemHandler);
  return app;
}
