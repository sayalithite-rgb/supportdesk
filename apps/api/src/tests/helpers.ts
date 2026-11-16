import jwt from 'jsonwebtoken';
import { signAccessToken } from '../utils/jwt';
import type { UserRole } from '../types/auth';

export const tokenFor = (id: string, role: UserRole): string => signAccessToken({ id, role });

export const expiredToken = (id: string, role: UserRole): string =>
  jwt.sign(
    { sub: id, role, exp: Math.floor(Date.now() / 1000) - 60 },
    process.env.JWT_SECRET as string,
    { algorithm: 'HS256' }
  );

export const wrongSecretToken = (id: string, role: UserRole): string =>
  jwt.sign({ role }, 'a-different-secret-a-different-secret-1', { algorithm: 'HS256', subject: id });