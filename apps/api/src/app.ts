import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './infrastructure/logging/logger.js';
import { globalRateLimiter } from './interface/http/middleware/rateLimiter.js';
import { notFoundHandler } from './interface/http/middleware/notFound.js';
import { errorHandler } from './interface/http/middleware/errorHandler.js';
import { apiRouter } from './interface/http/routes/index.js';

/**
 * Builds and returns the Express app WITHOUT starting it listening.
 *
 * Separating "build the app" (here) from "start listening" (server.ts) is
 * what makes the app testable: a future integration test suite can import
 * `createApp()` and drive it with a library like supertest, without binding
 * a real port or touching process lifecycle.
 */
export function createApp(): Express {
  const app = express();

  // --- Security & platform middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      // Keep access logs quiet for the health check so local dev logs
      // aren't spammed by uptime-monitor-style polling.
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );
  app.use(globalRateLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // --- Routes ---
  app.use('/api', apiRouter);

  // --- Fallback handlers (order matters: 404 before the error handler) ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
