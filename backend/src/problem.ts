import type { ErrorRequestHandler, RequestHandler, Response } from 'express';

// RFC 9457 problem details; `code` is a stable machine-readable reason for clients.
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, detail: string, readonly headers: Record<string, string> = {}) {
    super(detail);
    this.name = 'ApiError';
  }
}

const TITLES: Record<number, string> = {
  400: 'Bad Request', 404: 'Not Found', 405: 'Method Not Allowed', 413: 'Content Too Large',
  415: 'Unsupported Media Type', 422: 'Unprocessable Content', 429: 'Too Many Requests',
  500: 'Internal Server Error', 503: 'Service Unavailable',
};

export function sendProblem(res: Response, error: ApiError) {
  res.set(error.headers);
  return res.status(error.status).type('application/problem+json').json({
    type: 'about:blank', title: TITLES[error.status] ?? 'Error', status: error.status, code: error.code, detail: error.message,
  });
}

export function methodNotAllowed(allow: string): RequestHandler {
  return (req, res) => { sendProblem(res, new ApiError(405, 'method_not_allowed', `${req.method} không được hỗ trợ ở đường dẫn này.`, { Allow: allow })); };
}

export const notFound: RequestHandler = (req, res) => {
  sendProblem(res, new ApiError(404, 'not_found', `Không có API ${req.method} ${req.originalUrl}.`));
};

export const problemHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) return sendProblem(res, error);
  // body-parser marks malformed or oversized bodies with a type and an HTTP status.
  if (error?.type === 'entity.parse.failed') return sendProblem(res, new ApiError(400, 'malformed_json', 'Body không phải JSON hợp lệ.'));
  if (error?.type === 'entity.too.large') return sendProblem(res, new ApiError(413, 'body_too_large', 'Body vượt giới hạn 1MB.'));
  console.error('Unhandled API error:', error);
  return sendProblem(res, new ApiError(500, 'internal_error', error?.message || 'Lỗi không xác định.'));
};
