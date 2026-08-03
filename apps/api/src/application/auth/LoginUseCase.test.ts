import { describe, expect, it } from 'vitest';
import { LoginUseCase } from './LoginUseCase.js';
import { FakePasswordHasher, FakeRefreshTokenRepository, FakeTokenService, FakeUserRepository } from './testFakes.js';

async function buildUseCase() {
  const userRepository = new FakeUserRepository();
  const refreshTokenRepository = new FakeRefreshTokenRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();
  const useCase = new LoginUseCase(userRepository, refreshTokenRepository, passwordHasher, tokenService);

  await userRepository.create({ email: 'trader@example.com', passwordHash: await passwordHasher.hash('correcthorsebattery') });

  return { useCase, refreshTokenRepository };
}

describe('LoginUseCase', () => {
  it('logs in with correct credentials and issues both tokens', async () => {
    const { useCase } = await buildUseCase();

    const result = await useCase.execute({ email: 'trader@example.com', password: 'correcthorsebattery' });

    expect(result.user.email).toBe('trader@example.com');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('persists a hashed refresh token, never the raw one, on successful login', async () => {
    const { useCase, refreshTokenRepository } = await buildUseCase();

    const result = await useCase.execute({ email: 'trader@example.com', password: 'correcthorsebattery' });

    const stored = await refreshTokenRepository.findByTokenHash(`hashed:${result.refreshToken}`);
    expect(stored).not.toBeNull();
  });

  it('rejects a nonexistent email with a generic message', async () => {
    const { useCase } = await buildUseCase();

    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'whatever123' }),
    ).rejects.toThrow(/invalid email or password/i);
  });

  it('rejects the wrong password with the SAME generic message as a nonexistent email', async () => {
    // Deliberately verifies the account-enumeration protection documented
    // in LoginUseCase.ts - both failure modes must be indistinguishable.
    const { useCase } = await buildUseCase();

    let wrongPasswordMessage = '';
    let unknownEmailMessage = '';

    try {
      await useCase.execute({ email: 'trader@example.com', password: 'wrongpassword' });
    } catch (error) {
      wrongPasswordMessage = error instanceof Error ? error.message : '';
    }

    try {
      await useCase.execute({ email: 'nobody@example.com', password: 'wrongpassword' });
    } catch (error) {
      unknownEmailMessage = error instanceof Error ? error.message : '';
    }

    expect(wrongPasswordMessage).toBe(unknownEmailMessage);
    expect(wrongPasswordMessage).toMatch(/invalid email or password/i);
  });
});
