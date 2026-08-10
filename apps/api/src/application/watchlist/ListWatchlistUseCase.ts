import type { WatchlistItem } from '@quantlab/shared-types';
import type { IWatchlistRepository } from '../../infrastructure/persistence/repositories/WatchlistRepository.js';
import { toWatchlistItemDto } from './WatchlistMapper.js';

export class ListWatchlistUseCase {
  constructor(private readonly watchlistRepository: IWatchlistRepository) {}

  async execute(userId: string): Promise<WatchlistItem[]> {
    const items = await this.watchlistRepository.findManyVisibleToUser(userId);
    return items.map(toWatchlistItemDto);
  }
}
