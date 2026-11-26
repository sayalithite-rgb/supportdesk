import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
  };
};

function getAiRateLimitKey(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id ?? authReq.user?.sub;

  if (typeof userId === 'string' && userId.trim().length > 0) {
    return `user:${userId.trim()}`;
  }

  return `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
}

export function createAiRateLimiter(options: { windowMs: number; maxRequestsPerWindow: number }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.maxRequestsPerWindow,
    keyGenerator: getAiRateLimitKey,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      data: null,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many AI requests. Please wait a minute.',
      },
      meta: {},
    },
  });
}

export const aiRateLimiter = createAiRateLimiter({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000),
  maxRequestsPerWindow: Number(process.env.AI_RATE_LIMIT_MAX ?? 10),
});