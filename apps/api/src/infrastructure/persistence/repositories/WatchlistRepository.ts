import type { PrismaClient, WatchlistItem } from '@prisma/client';

/**
 * `symbol` values are always normalized to uppercase by the application
 * layer BEFORE reaching this repository (see AddToWatchlistUseCase /
 * RemoveFromWatchlistUseCase) - this class just persists whatever it's
 * given, matching the pattern already established elsewhere (repositories
 * don't own business rules, use cases do).
 */
export class WatchlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyForUser(userId: string): Promise<WatchlistItem[]> {
    return this.prisma.watchlistItem.findMany({ where: { userId }, orderBy: { addedAt: 'desc' } });
  }

  findOneForUser(userId: string, symbol: string): Promise<WatchlistItem | null> {
    return this.prisma.watchlistItem.findUnique({ where: { userId_symbol: { userId, symbol } } });
  }

  create(userId: string, symbol: string): Promise<WatchlistItem> {
    return this.prisma.watchlistItem.create({ data: { userId, symbol } });
  }

  delete(userId: string, symbol: string): Promise<WatchlistItem> {
    return this.prisma.watchlistItem.delete({ where: { userId_symbol: { userId, symbol } } });
  }
}
