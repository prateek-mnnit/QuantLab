import 'dotenv/config';
import { z } from 'zod';

/**
 * Validate process.env once, at boot, instead of trusting it implicitly
 * everywhere it's read. If a required variable is missing or malformed,
 * the process fails fast with a clear message instead of surfacing a
 * confusing error deep inside a request handler at 2am in production.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // Deliberately two separate secrets for access vs. refresh tokens - if one
  // secret ever leaked, rotating it would invalidate both token types at
  // once. Separate secrets let us rotate independently.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables - check your .env file against .env.example');
}

export const env = parsed.data;
export type Env = typeof env;
