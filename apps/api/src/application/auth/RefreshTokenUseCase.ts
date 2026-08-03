import type { IRefreshTokenRepository } from '../../infrastructure/persistence/repositories/RefreshTokenRepository.js';
import type { IUserRepository } from '../../infrastructure/persistence/repositories/UserRepository.js';
import type { TokenService } from '../../infrastructure/auth/TokenService.js';
import { UnauthorizedError } from '../errors/AppError.js';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Token ROTATION: every refresh both issues a new refresh token AND
   * revokes the one just used, rather than reusing the same refresh token
   * indefinitely. This is what makes theft detectable - if a stolen refresh
   * token is ever replayed after the legitimate user has already rotated
   * past it, the stolen one is now revoked and the request fails, rather
   * than silently succeeding for whoever has the token.
   */
  async execute(rawRefreshToken: string): Promise<RefreshResult> {
    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const existingToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken || existingToken.revokedAt || existingToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or expired. Please log in again.');
    }

    const user = await this.userRepository.findById(existingToken.userId);
    if (!user) {
      throw new UnauthorizedError('Refresh token is invalid or expired. Please log in again.');
    }

    await this.refreshTokenRepository.revoke(existingToken.id);

    const newRefreshToken = this.tokenService.generateRefreshToken();
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.tokenService.hashRefreshToken(newRefreshToken),
      expiresAt: this.tokenService.getRefreshTokenExpiry(),
    });

    return {
      accessToken: this.tokenService.signAccessToken({ userId: user.id }),
      refreshToken: newRefreshToken,
    };
  }
}
