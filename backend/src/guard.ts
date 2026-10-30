import type { Request, RequestHandler } from 'express';

// cloudflared and reverse proxies always add one of these; a direct local request never has them.
const FORWARD_HEADERS = ['cf-connecting-ip', 'x-forwarded-for', 'forwarded', 'x-real-ip'];
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export const LOCAL_RUNNER_PUBLIC_ERROR = 'LocalRunner chạy code thẳng trên máy chủ nên chỉ phục vụ request local. Khởi động backend với RUNNER=docker trước khi public qua tunnel/proxy.';

export function isDirectLocal(req: Request): boolean {
  return LOOPBACK.has(req.socket.remoteAddress || '') && !FORWARD_HEADERS.some(h => req.headers[h]);
}

// Behind a tunnel every request comes from 127.0.0.1, so key on the visitor address Cloudflare reports.
function clientKey(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  return (typeof cf === 'string' && cf) || req.socket.remoteAddress || 'unknown';
}

export function rateLimit(limit: number, windowMs: number, now = Date.now): RequestHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const t = now();
    const key = clientKey(req);
    let entry = hits.get(key);
    if (!entry || entry.reset <= t) {
      if (hits.size > 10000) for (const [k, v] of hits) if (v.reset <= t) hits.delete(k);
      entry = { count: 0, reset: t + windowMs };
      hits.set(key, entry);
    }
    if (++entry.count > limit) {
      const retry = Math.ceil((entry.reset - t) / 1000);
      res.set('Retry-After', String(retry));
      return res.status(429).json({ success: false, error: `Bạn gửi quá nhiều yêu cầu. Thử lại sau ${retry} giây.` });
    }
    next();
  };
}

export class BusyError extends Error { name = 'BusyError'; }

// Bounds compiler/container processes by job lifetime, so an aborted request cannot free a slot early.
export function createGate(maxActive: number, maxQueued: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async function run<T>(job: () => Promise<T>): Promise<T> {
    if (active >= maxActive) {
      if (waiting.length >= maxQueued) throw new BusyError('Máy chủ đang bận chạy code khác. Thử lại sau vài giây.');
      await new Promise<void>(resolve => waiting.push(resolve));
    } else active++;
    try { return await job(); }
    finally {
      const next = waiting.shift();
      if (next) next(); else active--;
    }
  };
}
