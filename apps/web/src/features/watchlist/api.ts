import type { WatchlistItem } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function fetchWatchlist(): Promise<WatchlistItem[]> {
  return apiRequest<WatchlistItem[]>('/watchlist');
}

export function addToWatchlistRequest(symbol: string): Promise<WatchlistItem> {
  return apiRequest<WatchlistItem>('/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) });
}

export function removeFromWatchlistRequest(symbol: string): Promise<void> {
  return apiRequest<void>(`/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' });
}
