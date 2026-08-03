import type { Prisma, PrismaClient, Strategy } from '@prisma/client';

/**
 * Same extraction, same reason as IUserRepository/IRefreshTokenRepository
 * (see Group V): the concrete class's private `prisma` field would
 * otherwise make it nominally typed, blocking any fake/in-memory test
 * double from being assignable here even with identical public methods.
 */
export interface IStrategyRepository {
  findManyByUser(userId: string): Promise<Strategy[]>;
  findByIdForUser(id: string, userId: string): Promise<Strategy | null>;
  create(userId: string, data: Omit<Prisma.StrategyUncheckedCreateInput, 'userId'>): Promise<Strategy>;
  update(id: string, data: Prisma.StrategyUpdateInput): Promise<Strategy>;
  delete(id: string): Promise<Strategy>;
}

export class StrategyRepository implements IStrategyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyByUser(userId: string): Promise<Strategy[]> {
    return this.prisma.strategy.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Scoped by BOTH id and userId in a single query, rather than fetching by
   * id and separately checking `strategy.userId === userId` in application
   * code. This means a user can never even detect whether another user's
   * strategy id exists (it 404s exactly like a nonexistent id would) -
   * that's a real security property (avoiding an ID enumeration /
   * information-disclosure gap), not just a style preference.
   */
  findByIdForUser(id: string, userId: string): Promise<Strategy | null> {
    return this.prisma.strategy.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: Omit<Prisma.StrategyUncheckedCreateInput, 'userId'>): Promise<Strategy> {
    return this.prisma.strategy.create({ data: { ...data, userId } });
  }

  update(id: string, data: Prisma.StrategyUpdateInput): Promise<Strategy> {
    return this.prisma.strategy.update({ where: { id }, data });
  }

  delete(id: string): Promise<Strategy> {
    return this.prisma.strategy.delete({ where: { id } });
  }
}
