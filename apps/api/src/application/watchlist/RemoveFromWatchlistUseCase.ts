import type { IWatchlistRepository } from '../../infrastructure/persistence/repositories/WatchlistRepository.js';
import { NotFoundError } from '../errors/AppError.js';

export class RemoveFromWatchlistUseCase {
  constructor(private readonly watchlistRepository: IWatchlistRepository) {}

  async execute(userId: string, rawSymbol: string): Promise<void> {
    const symbol = rawSymbol.trim().toUpperCase();

    const existing = await this.watchlistRepository.findOneForUser(userId, symbol);
    if (!existing) {
      throw new NotFoundError(`"${symbol}" is not on your watchlist.`);
    }

    await this.watchlistRepository.delete(userId, symbol);
  }
}
