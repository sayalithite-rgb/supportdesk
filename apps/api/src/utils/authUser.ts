import type { Request } from 'express';
import { AppError } from './AppError';
import type { AuthUser } from '../types/auth';

export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw AppError.unauthorized('Authentication required');
  return req.user;
}