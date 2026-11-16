import { Response } from 'express';

// Success envelope: { data, error: null, meta }
export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: Record<string, unknown> = {},
  status = 200
): void {
  res.status(status).json({ data, error: null, meta });
}