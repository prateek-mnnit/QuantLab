import type { RefreshTokenRepository } from '../../infrastructure/persistence/repositories/RefreshTokenRepository.js';
import type { TokenService } from '../../infrastructure/auth/TokenService.js';

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const existingToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    // Logging out with an already-invalid token isn't an error worth
    // surfacing - the end state the user wants (be logged out) is already
    // true, so this silently succeeds rather than 401ing on logout.
    if (existingToken && !existingToken.revokedAt) {
      await this.refreshTokenRepository.revoke(existingToken.id);
    }
  }
}