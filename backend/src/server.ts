import express from 'express';
import cors from 'cors';
import executeRouter from './routes/execute';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';

// CORS enabled for localhost:5173
app.use(cors({ origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',') }));

// JSON body parser with 1MB limit
app.use(express.json({ limit: '1mb' }));

// Health check: GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Execute route: POST /api/execute
app.use('/api/execute', executeRouter);

// Error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, host, () => {
  console.log(`CodeLens Backend running on port ${port}`);
});

