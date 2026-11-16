import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../types/auth';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}