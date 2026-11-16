import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import type { AuthUser } from '../types/auth';

const claimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(['customer', 'agent', 'admin']),
});

// Only the user id and role go into the token (never passwords or personal data)
export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
  });
}

// Throws if the signature is wrong, the token is expired, or the claims are bad
export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  const claims = claimsSchema.parse(decoded);
  return { id: claims.sub, role: claims.role };
}