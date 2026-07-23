import pino from 'pino';
import { env } from '../../config/env.js';

/**
 * A single structured logger instance for the whole app, rather than
 * scattering console.log calls through the codebase. Structured (JSON) logs
 * are what let a hosting platform's log viewer (Render/Railway) filter and
 * search logs in production; pino-pretty is only used in development where
 * a human is reading the terminal directly.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
