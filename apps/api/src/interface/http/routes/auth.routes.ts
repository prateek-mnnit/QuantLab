import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { createAuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';

/**
 * Auth endpoints get their own, much tighter rate limit than the global
 * default - these are exactly the routes brute-force/credential-stuffing
 * attacks target, so 20 requests/15min per IP here vs. 300/15min globally.
 */
const authRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

export function createAuthRouter(controller: ReturnType<typeof createAuthController>): Router {
  const router = Router();

  router.post('/register', authRateLimiter, validateBody(registerSchema), controller.register);
  router.post('/login', authRateLimiter, validateBody(loginSchema), controller.login);
  router.post('/refresh', authRateLimiter, controller.refresh);
  router.post('/logout', controller.logout);

  return router;
}
