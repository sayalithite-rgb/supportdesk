import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load apps/api/.env no matter where the command is run from
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce
    .number({ error: 'PORT must be a number' })
    .int()
    .min(1, 'PORT must be between 1 and 65535')
    .max(65535, 'PORT must be between 1 and 65535')
    .default(3000),

  DATABASE_URL: z
    .string({ error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL must not be empty')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must start with postgresql:// or postgres://'
    ),

  JWT_SECRET: z
    .string({ error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
    .refine(
      (origins) => origins.length > 0 && !origins.includes('*'),
      'CORS_ALLOWED_ORIGINS must list explicit origins (no wildcard)'
    ),

  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\nInvalid environment variables:\n');
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nFix your .env file (see .env.example) and start the app again.\n');
  process.exit(1);
}

export const env = result.data;
export type Env = typeof env;