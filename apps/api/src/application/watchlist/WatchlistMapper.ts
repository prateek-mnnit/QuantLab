import type { WatchlistItem as PrismaWatchlistItem } from '@prisma/client';
import type { WatchlistItem } from '@quantlab/shared-types';

export function toWatchlistItemDto(item: PrismaWatchlistItem): WatchlistItem {
  return {
    id: item.id,
    symbol: item.symbol,
    addedAt: item.addedAt.toISOString(),
    isBuiltIn: item.isBuiltIn,
  };
}
