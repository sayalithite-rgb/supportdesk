import rateLimit from 'express-rate-limit'

// express-rate-limit v6 mein 'limit' ki jagah 'max' likhte hain (loginRateLimiter dekho)
export const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Please wait a minute.' },
    meta: {},
  },
})