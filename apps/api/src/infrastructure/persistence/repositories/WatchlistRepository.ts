import type { PrismaClient, WatchlistItem } from '@prisma/client';

/**
 * Extracted (Group AH) for the same reason IStrategyRepository/
 * IUserRepository already were: the concrete class below has a private
 * `prisma` field, which makes it nominally typed - a fake/in-memory test
 * double with identical public methods is not actually assignable to a
 * parameter typed as the concrete `WatchlistRepository` class, even though
 * it behaves identically.
 */
export interface IWatchlistRepository {
  /** STRICT - only this exact user's own additions. */
  findManyForUser(userId: string): Promise<WatchlistItem[]>;
  /** STRICT - used for the add-conflict check and for delete, so a user can never delete a featured/built-in symbol (userId IS NULL never matches a real userId). */
  findOneForUser(userId: string, symbol: string): Promise<WatchlistItem | null>;
  /** VISIBLE - this user's own additions PLUS every featured/built-in symbol. Used for listing. */
  findManyVisibleToUser(userId: string): Promise<WatchlistItem[]>;
  /** GLOBAL - every featured/built-in symbol, regardless of requester. Used only by the seed script's own idempotency check. */
  findManyBuiltIn(): Promise<WatchlistItem[]>;
  /**
   * `userId: null` creates a featured/built-in symbol (Group AH) - only
   * the seed script ever passes null; every HTTP-triggered add goes
   * through `AddToWatchlistUseCase` with the authenticated user's real id,
   * which is never null.
   */
  create(userId: string | null, symbol: string, isBuiltIn?: boolean): Promise<WatchlistItem>;
  delete(userId: string, symbol: string): Promise<WatchlistItem>;
}

/**
 * `symbol` values are always normalized to uppercase by the application
 * layer BEFORE reaching this repository (see AddToWatchlistUseCase /
 * RemoveFromWatchlistUseCase) - this class just persists whatever it's
 * given, matching the pattern already established elsewhere (repositories
 * don't own business rules, use cases do).
 */
export class WatchlistRepository implements IWatchlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyForUser(userId: string): Promise<WatchlistItem[]> {
    return this.prisma.watchlistItem.findMany({ where: { userId }, orderBy: { addedAt: 'desc' } });
  }

  findOneForUser(userId: string, symbol: string): Promise<WatchlistItem | null> {
    return this.prisma.watchlistItem.findUnique({ where: { userId_symbol: { userId, symbol } } });
  }

  findManyVisibleToUser(userId: string): Promise<WatchlistItem[]> {
    return this.prisma.watchlistItem.findMany({
      where: { OR: [{ userId }, { isBuiltIn: true }] },
      orderBy: [{ isBuiltIn: 'desc' }, { addedAt: 'desc' }],
    });
  }

  findManyBuiltIn(): Promise<WatchlistItem[]> {
    return this.prisma.watchlistItem.findMany({ where: { isBuiltIn: true } });
  }

  /**
   * `isBuiltIn` defaults false for every normal watchlist add - only
   * Group AH's seed script ever passes `true` (with `userId: null`), to
   * create a featured/built-in symbol.
   */
  create(userId: string | null, symbol: string, isBuiltIn = false): Promise<WatchlistItem> {
    return this.prisma.watchlistItem.create({ data: { userId, symbol, isBuiltIn } });
  }

  delete(userId: string, symbol: string): Promise<WatchlistItem> {
    return this.prisma.watchlistItem.delete({ where: { userId_symbol: { userId, symbol } } });
  }
}
