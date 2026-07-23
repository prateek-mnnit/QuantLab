import type { Request, Response } from 'express';
import type { ApiSuccessResponse, AuthUser, LoginResult } from '@quantlab/shared-types';
import type { RegisterUseCase } from '../../../application/auth/RegisterUseCase.js';
import type { LoginUseCase } from '../../../application/auth/LoginUseCase.js';
import type { RefreshTokenUseCase } from '../../../application/auth/RefreshTokenUseCase.js';
import type { LogoutUseCase } from '../../../application/auth/LogoutUseCase.js';
import { env } from '../../../config/env.js';

const REFRESH_COOKIE_NAME = 'quantlab_refresh_token';

/**
 * httpOnly cookie options shared by every place we set/clear the refresh
 * cookie. `httpOnly` means client-side JavaScript can't read this cookie at
 * all (mitigates XSS stealing it); `sameSite: 'lax'` mitigates CSRF for a
 * same-site app; `secure` is only enabled outside local dev since it
 * requires HTTPS, which localhost doesn't have.
 */
function refreshCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeMs,
    path: '/api/auth',
  };
}

/**
 * Controller factory: takes the use cases it needs (wired up in
 * container.ts) and returns the actual Express handlers. Controllers stay
 * thin on purpose - parse the request, call exactly one use case, shape the
 * HTTP response. Every real decision (is this email taken, is this
 * password correct, how does token rotation work) lives in the use case,
 * not here.
 */
export function createAuthController(dependencies: {
  registerUseCase: RegisterUseCase;
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  logoutUseCase: LogoutUseCase;
}) {
  const { registerUseCase, loginUseCase, refreshTokenUseCase, logoutUseCase } = dependencies;
  const refreshMaxAgeMs = env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  return {
    async register(req: Request, res: Response): Promise<void> {
      const user = await registerUseCase.execute(req.body);
      const body: ApiSuccessResponse<AuthUser> = { success: true, data: user };
      res.status(201).json(body);
    },

    async login(req: Request, res: Response): Promise<void> {
      const result = await loginUseCase.execute(req.body);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions(refreshMaxAgeMs));

      const body: ApiSuccessResponse<LoginResult> = {
        success: true,
        data: { user: result.user, tokens: { accessToken: result.accessToken } },
      };
      res.status(200).json(body);
    },

    async refresh(req: Request, res: Response): Promise<void> {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
      const result = await refreshTokenUseCase.execute(rawRefreshToken ?? '');

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions(refreshMaxAgeMs));

      const body: ApiSuccessResponse<{ accessToken: string }> = {
        success: true,
        data: { accessToken: result.accessToken },
      };
      res.status(200).json(body);
    },

    async logout(req: Request, res: Response): Promise<void> {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
      await logoutUseCase.execute(rawRefreshToken);

      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      const body: ApiSuccessResponse<{ loggedOut: true }> = { success: true, data: { loggedOut: true } };
      res.status(200).json(body);
    },
  };
}
