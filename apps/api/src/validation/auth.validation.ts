import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('A valid email is required')
  .max(254);

// bcrypt only uses the first 72 bytes, so longer passwords are rejected
const newPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

// strictObject: a "role" field in the body is rejected, so nobody can self-assign agent/admin
export const registerSchema = z.strictObject({
  name: z.string().trim().min(1, 'name is required').max(100),
  email: emailSchema,
  password: newPasswordSchema,
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'password is required').max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;