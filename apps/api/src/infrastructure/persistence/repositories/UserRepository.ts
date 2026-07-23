import type { PrismaClient, User } from '@prisma/client';

/**
 * Repository pattern: wraps all direct Prisma access to the `users` table
 * behind a small set of intention-revealing methods (`findByEmail`,
 * `create`, ...) instead of use cases calling `prisma.user.findUnique(...)`
 * inline. Two concrete benefits: (1) use cases stay testable with a fake
 * in-memory repository instead of a real database, and (2) if the ORM ever
 * changed, only repository files would need to.
 */
export class UserRepository {
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
