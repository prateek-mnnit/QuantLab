import type { NextFunction, Request, Response } from 'express';
import type { TokenService } from '../../../infrastructure/auth/TokenService.js';
import { UnauthorizedError } from '../../../application/errors/AppError.js';

/**
 * A middleware FACTORY (a function that returns middleware) rather than a
 * middleware that reaches for a global TokenService itself. This keeps the
 * dependency explicit and injected from the composition root (container.ts),
 * matching how every other layer in this app gets its dependencies -
 * there's no hidden global state to reason about, and it's trivially
 * testable by passing in a fake TokenService.
 */
export function createAuthenticateMiddleware(tokenService: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next(new UnauthorizedError('Missing or malformed Authorization header.'));
      return;
    }

    const token = authHeader.slice('Bearer '.length);
    const payload = tokenService.verifyAccessToken(token); // throws UnauthorizedError on failure

    req.user = { id: payload.userId };
    next();
  };
}
