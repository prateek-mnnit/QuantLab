import { describe, expect, it } from 'vitest';
import { RegisterUseCase } from './RegisterUseCase.js';
import { FakePasswordHasher, FakeUserRepository } from './testFakes.js';

function buildUseCase() {
  const userRepository = new FakeUserRepository();
  const passwordHasher = new FakePasswordHasher();
  return { useCase: new RegisterUseCase(userRepository, passwordHasher), userRepository };
}

describe('RegisterUseCase', () => {
  it('creates a new account and returns only id/email, never the password hash', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({ email: 'trader@example.com', password: 'correcthorsebattery' });

    expect(result).toEqual({ id: expect.any(String), email: 'trader@example.com' });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('hashes the password rather than storing it in plain text', async () => {
    const { useCase, userRepository } = buildUseCase();

    await useCase.execute({ email: 'trader@example.com', password: 'correcthorsebattery' });

    const stored = await userRepository.findByEmail('trader@example.com');
    expect(stored?.passwordHash).not.toBe('correcthorsebattery');
    expect(stored?.passwordHash).toBe('hashed:correcthorsebattery');
  });

  it('rejects registration with an email that is already in use', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute({ email: 'trader@example.com', password: 'correcthorsebattery' });

    await expect(
      useCase.execute({ email: 'trader@example.com', password: 'differentpassword123' }),
    ).rejects.toThrow(/already exists/i);
  });
});
