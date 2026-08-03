import { describe, expect, it } from 'vitest';
import { RefreshTokenUseCase } from './RefreshTokenUseCase.js';
import { FakeRefreshTokenRepository, FakeTokenService, FakeUserRepository } from './testFakes.js';

async function buildUseCase() {
  const userRepository = new FakeUserRepository();
  const refreshTokenRepository = new FakeRefreshTokenRepository();
  const tokenService = new FakeTokenService();
  const useCase = new RefreshTokenUseCase(refreshTokenRepository, userRepository, tokenService);

  const user = await userRepository.create({ email: 'trader@example.com', passwordHash: 'irrelevant' });
  const rawRefreshToken = tokenService.generateRefreshToken();
  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: tokenService.hashRefreshToken(rawRefreshToken),
    expiresAt: tokenService.getRefreshTokenExpiry(),
  });

  return { useCase, refreshTokenRepository, tokenService, rawRefreshToken, userId: user.id };
}

describe('RefreshTokenUseCase', () => {
  it('issues a new access + refresh token for a valid refresh token', async () => {
    const { useCase, rawRefreshToken } = await buildUseCase();

    const result = await useCase.execute(rawRefreshToken);

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(rawRefreshToken);
  });

  it('ROTATION: revokes the token that was just used', async () => {
    const { useCase, refreshTokenRepository, tokenService, rawRefreshToken } = await buildUseCase();

    await useCase.execute(rawRefreshToken);

    const oldToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken));
    expect(oldToken?.revokedAt).not.toBeNull();
  });

  it('THEFT DETECTION: rejects a replayed (already-rotated) refresh token', async () => {
    const { useCase, rawRefreshToken } = await buildUseCase();

    // The legitimate rotation.
    await useCase.execute(rawRefreshToken);

    // A replay of the now-superseded token - simulating a stolen token
    // being used after the real owner already refreshed past it.
    await expect(useCase.execute(rawRefreshToken)).rejects.toThrow(/invalid or expired/i);
  });

  it('rejects a refresh token that was never issued', async () => {
    const { useCase } = await buildUseCase();

    await expect(useCase.execute('a-token-that-was-never-created')).rejects.toThrow(/invalid or expired/i);
  });

  it('rejects an expired refresh token', async () => {
    const { useCase, refreshTokenRepository, tokenService, userId } = await buildUseCase();

    const expiredRawToken = tokenService.generateRefreshToken();
    await refreshTokenRepository.create({
      userId,
      tokenHash: tokenService.hashRefreshToken(expiredRawToken),
      expiresAt: new Date(Date.now() - 1000), // already in the past
    });

    await expect(useCase.execute(expiredRawToken)).rejects.toThrow(/invalid or expired/i);
  });
});
