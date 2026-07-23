import type { UserRepository } from '../../infrastructure/persistence/repositories/UserRepository.js';
import type { PasswordHasher } from '../../infrastructure/auth/PasswordHasher.js';
import { ConflictError } from '../errors/AppError.js';
import type { AuthUser } from '@quantlab/shared-types';

/**
 * Use case pattern: one class, one business operation, named after what it
 * does ("RegisterUser") rather than what table it touches. Dependencies
 * (the repository, the hasher) are constructor-injected as INTERFACES the
 * class depends on - this class has no idea Prisma or argon2 exist
 * underneath. That's what makes it unit-testable with fakes and is the
 * concrete payoff of the layered architecture: this file could be tested
 * with an in-memory fake UserRepository and a fake PasswordHasher, with no
 * database or real hashing involved at all.
 */
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: { email: string; password: string }): Promise<AuthUser> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({ email: input.email, passwordHash });

    return { id: user.id, email: user.email };
  }
}
