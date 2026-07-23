import rateLimit from 'express-rate-limit';

/**
 * Baseline protection against accidental abuse (e.g. a runaway frontend
 * retry loop) or basic scripted attacks. Applied globally in app.ts;
 * individual sensitive routes (auth, backtests) get their own tighter
 * limiter once those routes exist.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
