import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type NormalizedError = { status: number; code: string; message: string };

function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AppError) {
    return { status: err.statusCode, code: err.code, message: err.message };
  }

  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ');
    return { status: 400, code: 'VALIDATION_ERROR', message };
  }

  // Body parser errors (bad JSON, body too large)
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const type = (err as { type?: unknown }).type;
    if (type === 'entity.parse.failed') {
      return { status: 400, code: 'INVALID_JSON', message: 'Request body contains invalid JSON' };
    }
    if (type === 'entity.too.large') {
      return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
    }
  }

  // Anything unexpected: generic message, details only in the server log
  return { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
}

// Must be registered last and must have 4 parameters
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { status, code, message } = normalizeError(err);
  if (status >= 500) console.error('Unhandled error:', err);

  res.status(status).json({ data: null, error: { code, message }, meta: {} });
}