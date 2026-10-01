import express from 'express';
import cors from 'cors';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import executeRouter from './routes/execute.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';

// Origins contain scheme and host, but no path such as /codelens/.
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({ origin: origins }));

// JSON body parser with 1MB limit
app.use(express.json({ limit: '1mb' }));

// Health check: GET /api/health
const execFileAsync = promisify(execFile);
app.get('/api/health', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  const docker = process.env.NODE_ENV === 'production' || process.env.RUNNER === 'docker';
  if (docker) {
    try {
      // Both checks must use the same Docker daemon as DockerRunner.
      await execFileAsync('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 3000 });
      await execFileAsync('docker', ['image', 'inspect', 'codelens-sandbox'], { timeout: 3000 });
    } catch {
      return res.status(503).json({ status: 'unavailable', error: 'Backend đã nhận kết nối nhưng Docker hoặc image codelens-sandbox chưa sẵn sàng.' });
    }
  }
  res.json({ status: 'ok', runner: docker ? 'docker' : 'local' });
});

// Execute route: POST /api/execute
app.use('/api/execute', executeRouter);

app.listen(port, host, () => {
  console.log(`CodeLens Backend running on http://${host}:${port}`);
});
