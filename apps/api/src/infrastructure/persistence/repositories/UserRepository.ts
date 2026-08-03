import type { PrismaClient, User } from '@prisma/client';

/**
 * Extracted so callers (the auth use cases) can depend on this interface
 * instead of the concrete class below. The concrete class has a private
 * `prisma` field, which makes TypeScript treat it as effectively
 * nominally typed - a fake/in-memory test double with identical public
 * methods would NOT be assignable to a parameter typed as the concrete
 * `UserRepository` class, even though it behaves identically. Depending
 * on this interface instead is what actually makes the "testable with a
 * fake in-memory repository" claim below true, rather than just stated.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string }): Promise<User>;
}

/**
 * Repository pattern: wraps all direct Prisma access to the `users` table
 * behind a small set of intention-revealing methods (`findByEmail`,
 * `create`, ...) instead of use cases calling `prisma.user.findUnique(...)`
 * inline. Two concrete benefits: (1) use cases stay testable with a fake
 * in-memory repository instead of a real database, and (2) if the ORM ever
 * changed, only repository files would need to.
 */
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: { email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
