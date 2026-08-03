import { describe, expect, it } from 'vitest';
import { LogoutUseCase } from './LogoutUseCase.js';
import { FakeRefreshTokenRepository, FakeTokenService } from './testFakes.js';

describe('LogoutUseCase', () => {
  it('revokes a valid refresh token', async () => {
    const refreshTokenRepository = new FakeRefreshTokenRepository();
    const tokenService = new FakeTokenService();
    const useCase = new LogoutUseCase(refreshTokenRepository, tokenService);

    const rawToken = tokenService.generateRefreshToken();
    await refreshTokenRepository.create({
      userId: 'user-1',
      tokenHash: tokenService.hashRefreshToken(rawToken),
      expiresAt: tokenService.getRefreshTokenExpiry(),
    });

    await useCase.execute(rawToken);

    const stored = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken(rawToken));
    expect(stored?.revokedAt).not.toBeNull();
  });

  it('succeeds silently (no throw) when no refresh token is provided', async () => {
    const refreshTokenRepository = new FakeRefreshTokenRepository();
    const tokenService = new FakeTokenService();
    const useCase = new LogoutUseCase(refreshTokenRepository, tokenService);

    await expect(useCase.execute(undefined)).resolves.toBeUndefined();
  });

  it('succeeds silently when the refresh token is already revoked or unknown', async () => {
    const refreshTokenRepository = new FakeRefreshTokenRepository();
    const tokenService = new FakeTokenService();
    const useCase = new LogoutUseCase(refreshTokenRepository, tokenService);

    await expect(useCase.execute('a-token-that-was-never-issued')).resolves.toBeUndefined();
  });
});
