import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../application/errors/AppError.js';

export interface AccessTokenPayload {
  userId: string;
}

/**
 * JWT (JSON Web Token): a signed (not encrypted) token containing claims -
 * here just the user id. "Signed" means anyone can read its contents, but
 * only someone holding the secret can produce a token the server accepts,
 * which is what lets the server verify identity on every request without a
 * database lookup per call (unlike a traditional session-id-in-a-table
 * approach in plain Express apps, where every request means a DB read).
 * The trade-off: a JWT can't be revoked before it expires, which is exactly
 * why the access token here is short-lived (15 min) and paired with a
 * separate, database-backed, revocable refresh token for staying logged in
 * longer.
 *
 * The refresh token itself is NOT a JWT - it's a high-entropy random string.
 * Refresh tokens must be revocable (logout, theft detection), which a
 * stateless JWT can't do without extra infrastructure (a blocklist), so a
 * plain opaque token backed by the `RefreshToken` table is simpler and is
 * exactly what that table exists for.
 */
export class TokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'] });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload & jwt.JwtPayload;
    } catch {
      throw new UnauthorizedError('Access token is invalid or expired');
    }
  }

  /** Generates the raw refresh token given to the client (set as an httpOnly cookie). */
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Refresh tokens are already 512 bits of cryptographic randomness, unlike
   * a human-chosen password - so a fast, deterministic hash (SHA-256) is
   * the right tool here, not argon2. Determinism is actually required: it's
   * what lets `RefreshTokenRepository` look a token up directly by its
   * hash instead of loading every row to compare against a slow, salted
   * hash.
   */
  hashRefreshToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  getRefreshTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);
    return expiry;
  }
}
