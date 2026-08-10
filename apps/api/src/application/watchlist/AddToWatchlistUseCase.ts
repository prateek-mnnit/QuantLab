import type { WatchlistItem } from '@quantlab/shared-types';
import type { IWatchlistRepository } from '../../infrastructure/persistence/repositories/WatchlistRepository.js';
import type { MarketDataProvider } from '../../infrastructure/market-data/MarketDataProvider.js';
import { ConflictError } from '../errors/AppError.js';
import { toWatchlistItemDto } from './WatchlistMapper.js';

/**
 * A window wide enough to comfortably span at least one full trading week
 * even around a holiday, so a legitimate symbol is never mistaken for an
 * invalid one just because the validation happened to land on a quiet
 * stretch of the calendar.
 */
const VALIDATION_WINDOW_DAYS = 14;

export class AddToWatchlistUseCase {
  constructor(
    private readonly watchlistRepository: IWatchlistRepository,
    private readonly marketDataProvider: MarketDataProvider,
  ) {}

  /**
   * `userId: null` creates a featured/built-in symbol - ONLY Group AH's
   * seed script ever passes null. The HTTP layer's controller always
   * calls this with `req.user!.id`, so a normal `POST /api/watchlist`
   * request can never create featured content this way.
   *
   * The conflict check below branches on `userId === null` because
   * "does the requester already have this" isn't a meaningful question
   * for a null (no-requester) seed call - `findOneForUser` needs a real
   * userId (it's a compound-key lookup on `[userId, symbol]`), so the
   * seed path instead checks "is this symbol already a featured item"
   * directly via `findManyBuiltIn`.
   */
  async execute(userId: string | null, rawSymbol: string, options?: { isBuiltIn?: boolean }): Promise<WatchlistItem> {
    // Normalized once, here, so "aapl" and "AAPL" are treated as the same
    // watchlist entry - the same normalize-in-the-use-case pattern
    // RegisterUseCase already applies to email.
    const symbol = rawSymbol.trim().toUpperCase();

    const existing =
      userId === null
        ? (await this.watchlistRepository.findManyBuiltIn()).find((item) => item.symbol === symbol) ?? null
        : await this.watchlistRepository.findOneForUser(userId, symbol);
    if (existing) {
      throw new ConflictError(
        userId === null ? `"${symbol}" is already a featured symbol.` : `"${symbol}" is already on your watchlist.`,
      );
    }

    // Confirms the symbol is real BEFORE it's ever saved, reusing the same
    // MarketDataProvider.getCandles(...) every other market-data consumer
    // in the app already calls (GetCandlesUseCase, RunBacktestUseCase) -
    // no new provider method, no second "does this symbol exist"
    // abstraction. When Yahoo has no data for a symbol at all, the
    // provider itself throws NotFoundError (see YahooFinanceProvider) -
    // that's already a proper AppError, so it propagates as-is and the
    // central error handler turns it into a clean 404 without this use
    // case needing to know anything about HTTP. A symbol that's real but
    // simply had no trades in this specific window (rare for a 14-day
    // span) still returns an empty-but-successful candle list rather than
    // throwing, so it is NOT rejected - only a genuinely unrecognized
    // symbol is.
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - VALIDATION_WINDOW_DAYS);
    await this.marketDataProvider.getCandles(symbol, '1D', from, to);

    const item = await this.watchlistRepository.create(userId, symbol, options?.isBuiltIn ?? false);
    return toWatchlistItemDto(item);
  }
}
