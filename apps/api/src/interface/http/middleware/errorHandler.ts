import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorResponse } from '@quantlab/shared-types';
import { AppError } from '../../../application/errors/AppError.js';
import { logger } from '../../../infrastructure/logging/logger.js';

/**
 * The single place in the entire app that turns an error into an HTTP
 * response. Controllers never format error JSON themselves - they just
 * `throw` (or call `next(error)`), which keeps controller code focused on
 * the happy path and guarantees every error response has the same shape.
 *
 * Must be registered LAST, after all routes - Express identifies error
 * middleware by its four-argument signature.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    };
    res.status(error.statusCode).json(body);
    return;
  }

  // Anything that isn't an AppError is unexpected - log the full error for
  // debugging, but never leak internal details (stack traces, DB errors) to
  // the client.
  logger.error({ err: error, path: req.path, method: req.method }, 'Unhandled error');

  const body: ApiErrorResponse = {
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
  };
  res.status(500).json(body);
}
