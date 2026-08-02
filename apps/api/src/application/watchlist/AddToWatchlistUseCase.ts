import type { WatchlistItem } from '@quantlab/shared-types';
import type { WatchlistRepository } from '../../infrastructure/persistence/repositories/WatchlistRepository.js';
import { ConflictError } from '../errors/AppError.js';
import { toWatchlistItemDto } from './WatchlistMapper.js';

export class AddToWatchlistUseCase {
  constructor(private readonly watchlistRepository: WatchlistRepository) {}

  async execute(userId: string, rawSymbol: string): Promise<WatchlistItem> {
    // Normalized once, here, so "aapl" and "AAPL" are treated as the same
    // watchlist entry - the same normalize-in-the-use-case pattern
    // RegisterUseCase already applies to email.
    const symbol = rawSymbol.trim().toUpperCase();

    const existing = await this.watchlistRepository.findOneForUser(userId, symbol);
    if (existing) {
      throw new ConflictError(`"${symbol}" is already on your watchlist.`);
    }

    const item = await this.watchlistRepository.create(userId, symbol);
    return toWatchlistItemDto(item);
  }
}
