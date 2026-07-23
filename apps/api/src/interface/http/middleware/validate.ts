import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../../../application/errors/AppError.js';

/**
 * A single generic middleware factory used by every route that accepts a
 * body, rather than each controller hand-rolling its own validation. Takes
 * a zod schema, returns real Express middleware; on success it REPLACES
 * `req.body` with the parsed result (so downstream code gets the coerced/
 * defaulted values - e.g. trimmed, lowercased email - not the raw input).
 * On failure it throws a `ValidationError`, which the central error handler
 * turns into a 400 with per-field details attached.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new ValidationError('Request body failed validation.', result.error.flatten()));
      return;
    }

    req.body = result.data;
    next();
  };
}
