import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  // 12 chars minimum rather than the more common 8 - a deliberate,
  // slightly stricter baseline given this handles a financial product.
  password: z.string().min(12, 'Password must be at least 12 characters.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
