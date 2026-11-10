import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

const REDACTED = '[REDACTED]';
const SENSITIVE_WORDS = ['password', 'passwd', 'token', 'authorization', 'cookie', 'secret', 'apikey', 'jwt'];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return SENSITIVE_WORDS.some((word) => normalized.includes(word));
}

// Hide secrets in the query string, e.g. /reset?token=abc
function sanitizeUrl(originalUrl: string): string {
  const url = new URL(originalUrl, 'http://localhost');
  for (const key of Array.from(url.searchParams.keys())) {
    if (isSensitiveKey(key)) url.searchParams.set(key, REDACTED);
  }
  return decodeURIComponent(url.pathname + url.search);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    // Request bodies and the Authorization header value are never logged
    const line = JSON.stringify({
      time: new Date().toISOString(),
      requestId,
      method: req.method,
      path: sanitizeUrl(req.originalUrl),
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
    });

    if (res.statusCode >= 500) console.error(line);
    else if (res.statusCode >= 400) console.warn(line);
    else console.log(line);
  });

  next();
}