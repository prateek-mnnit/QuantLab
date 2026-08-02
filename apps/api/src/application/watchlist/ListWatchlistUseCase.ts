import type { WatchlistItem } from '@quantlab/shared-types';
import type { WatchlistRepository } from '../../infrastructure/persistence/repositories/WatchlistRepository.js';
import { toWatchlistItemDto } from './WatchlistMapper.js';

export class ListWatchlistUseCase {
  constructor(private readonly watchlistRepository: WatchlistRepository) {}

  async execute(userId: string): Promise<WatchlistItem[]> {
    const items = await this.watchlistRepository.findManyForUser(userId);
    return items.map(toWatchlistItemDto);
  }
}
