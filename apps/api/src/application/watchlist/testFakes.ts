import type { WatchlistItem } from '@prisma/client';
import type { Candle, SymbolResult, Timeframe } from '@quantlab/shared-types';
import type { MarketDataProvider } from '../../infrastructure/market-data/MarketDataProvider.js';

/**
 * An in-memory stand-in for WatchlistRepository - same purpose and pattern
 * as FakeStrategyRepository (Group W) / FakeBacktestRunRepository (Group X).
 * WatchlistRepository has no extracted interface (unlike IStrategyRepository),
 * so this fake isn't declared `implements` anything; it just matches the
 * repository's public method shape structurally, which is all the use
 * cases' constructor parameter types require.
 *
 * `userId_symbol` is a real Prisma compound-unique constraint on
 * WatchlistItem (see schema.prisma), so this fake enforces that same
 * one-row-per-(user,symbol) invariant rather than silently allowing
 * duplicates the real database never would.
 */
export class FakeWatchlistRepository {
  private readonly items: WatchlistItem[] = [];
  private idCounter = 0;

  async findManyForUser(userId: string): Promise<WatchlistItem[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  async findOneForUser(userId: string, symbol: string): Promise<WatchlistItem | null> {
    return this.items.find((item) => item.userId === userId && item.symbol === symbol) ?? null;
  }

  async create(userId: string, symbol: string): Promise<WatchlistItem> {
    this.idCounter += 1;
    const item: WatchlistItem = {
      id: `watchlist-item-${this.idCounter}`,
      userId,
      symbol,
      // Offset by idCounter milliseconds (rather than a bare `new Date()`)
      // so items created within the same test - often microseconds apart -
      // still get strictly increasing timestamps. Without this, two adds
      // landing in the same millisecond would tie, and findManyForUser's
      // "most recent first" sort would silently fall back to insertion
      // order instead, making ordering tests flaky on fast machines.
      addedAt: new Date(Date.now() + this.idCounter),
    };
    this.items.push(item);
    return item;
  }

  async delete(userId: string, symbol: string): Promise<WatchlistItem> {
    const index = this.items.findIndex((item) => item.userId === userId && item.symbol === symbol);
    if (index === -1) {
      throw new Error(`FakeWatchlistRepository: no watchlist item for user "${userId}" and symbol "${symbol}"`);
    }
    const [deleted] = this.items.splice(index, 1);
    return deleted!;
  }
}

/**
 * A minimal, controllable stand-in for MarketDataProvider - same fake as
 * backtests/testFakes.ts, duplicated locally rather than imported across
 * feature folders (matching this codebase's existing precedent of
 * FakeStrategyRepository living once in strategies/ but market-data fakes
 * being small enough to redeclare per feature; see backtests/testFakes.ts
 * for the sibling copy). Lets a test decide exactly what candles - or
 * error - AddToWatchlistUseCase's symbol-validation call receives, without
 * ever touching the network.
 */
export class FakeMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly candlesToReturn: Candle[] = [],
    private readonly errorToThrow: Error | null = null,
  ) {}

  async getCandles(_symbol: string, _timeframe: Timeframe, _from: Date, _to: Date): Promise<Candle[]> {
    if (this.errorToThrow) throw this.errorToThrow;
    return this.candlesToReturn;
  }

  async searchSymbols(_query: string): Promise<SymbolResult[]> {
    return [];
  }
}

/**
 * One flat candle - enough for AddToWatchlistUseCase's validation call,
 * which only checks that at least some data comes back for the symbol; the
 * bar's actual price/time values are irrelevant to that check.
 */
export function buildValidationCandle(): Candle {
  return { time: 0, open: 100, high: 100, low: 100, close: 100, volume: 1000 };
}
