import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

const router = Router();

// Lightweight: no database call, only confirms the process is responding
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;