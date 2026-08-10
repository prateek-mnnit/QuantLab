import type { Prisma, PrismaClient, Strategy } from '@prisma/client';

/**
 * Same extraction, same reason as IUserRepository/IRefreshTokenRepository
 * (see Group V): the concrete class's private `prisma` field would
 * otherwise make it nominally typed, blocking any fake/in-memory test
 * double from being assignable here even with identical public methods.
 */
export interface IStrategyRepository {
  /** STRICT - only strategies this exact user owns. Used for update/delete, where accidentally including a built-in strategy would let it be mutated or deleted. */
  findManyByUser(userId: string): Promise<Strategy[]>;
  /** STRICT - see findManyByUser. Used for update/delete ownership checks. */
  findByIdForUser(id: string, userId: string): Promise<Strategy | null>;
  /** VISIBLE - this user's own strategies PLUS every built-in strategy. Used for listing/reading, where built-in content should be visible to everyone. */
  findManyVisibleToUser(userId: string): Promise<Strategy[]>;
  /**
   * VISIBLE - see findManyVisibleToUser. `userId: null` is accepted
   * directly (rather than requiring a caller to branch) so
   * RunBacktestUseCase's seed-triggered calls (which have no requesting
   * user at all) resolve correctly through the exact same query: matching
   * `isBuiltIn: true` alone, since a null requester can never also match a
   * real owned strategy.
   */
  findByIdVisibleToUser(id: string, userId: string | null): Promise<Strategy | null>;
  /** GLOBAL - every built-in strategy, regardless of requester. Used only by the seed script's own idempotency checks (there is no "requesting user" at seed time). */
  findManyBuiltIn(): Promise<Strategy[]>;
  /**
   * `userId: null` creates a built-in/product-level strategy (Group AH) -
   * only the seed script ever passes null; every HTTP-triggered create
   * goes through `CreateStrategyUseCase` with the authenticated user's
   * real id, which is never null.
   */
  create(userId: string | null, data: Omit<Prisma.StrategyUncheckedCreateInput, 'userId'>): Promise<Strategy>;
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
   * information-disclosure gap), not just a style preference. It also
   * means a built-in strategy (userId IS NULL) can never match here for
   * ANY requested userId - equality against a real id never matches NULL -
   * which is exactly what keeps built-in strategies un-editable and
   * un-deletable without any extra "is this built-in" guard in
   * Update/DeleteStrategyUseCase.
   */
  findByIdForUser(id: string, userId: string): Promise<Strategy | null> {
    return this.prisma.strategy.findFirst({ where: { id, userId } });
  }

  /** Own strategies (real userId match) UNIONed with every built-in one - see IStrategyRepository's doc comment for when to use this vs. the strict variant. */
  findManyVisibleToUser(userId: string): Promise<Strategy[]> {
    return this.prisma.strategy.findMany({
      where: { OR: [{ userId }, { isBuiltIn: true }] },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findByIdVisibleToUser(id: string, userId: string | null): Promise<Strategy | null> {
    return this.prisma.strategy.findFirst({ where: { id, OR: [{ userId }, { isBuiltIn: true }] } });
  }

  findManyBuiltIn(): Promise<Strategy[]> {
    return this.prisma.strategy.findMany({ where: { isBuiltIn: true } });
  }

  create(userId: string | null, data: Omit<Prisma.StrategyUncheckedCreateInput, 'userId'>): Promise<Strategy> {
    return this.prisma.strategy.create({ data: { ...data, userId } });
  }

  update(id: string, data: Prisma.StrategyUpdateInput): Promise<Strategy> {
    return this.prisma.strategy.update({ where: { id }, data });
  }

  delete(id: string): Promise<Strategy> {
    return this.prisma.strategy.delete({ where: { id } });
  }
}
