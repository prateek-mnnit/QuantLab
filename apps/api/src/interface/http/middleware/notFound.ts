import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@quantlab/shared-types';

/**
 * Catches any request that didn't match a route. Registered after all real
 * routes but before the error handler, so unmatched routes get a clean,
 * consistently-shaped 404 instead of Express's default HTML error page.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `No route matches ${req.method} ${req.path}`,
    },
  };
  res.status(404).json(body);
}
