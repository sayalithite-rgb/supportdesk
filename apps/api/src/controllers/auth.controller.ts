import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema } from '../validation/auth.validation';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    sendSuccess(res, result, {}, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    sendSuccess(res, result);
  }),
};