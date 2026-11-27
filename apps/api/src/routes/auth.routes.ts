import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { loginRateLimiter } from '../middleware/rateLimiters';

const router = Router();

router.post('/register', authController.register);
router.post('/login', loginRateLimiter, authController.login);

export default router;