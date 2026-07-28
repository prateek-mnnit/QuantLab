import { useQuery } from '@tanstack/react-query';
import type { Timeframe } from '@quantlab/shared-types';
import { fetchCandles, searchSymbols } from './api';

/**
 * `enabled` gates the query on a non-empty, trimmed query string - without
 * it, every keystroke on an empty search box would still fire a request.
 * `staleTime` is longer than the app-wide default (30s) since a symbol
 * search result for "AAPL" is extremely unlikely to change within a
 * session, unlike price data.
 */
export function useSymbolSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['symbol-search', trimmed],
    queryFn: () => searchSymbols(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 60_000,
  });
}

export function useCandles(symbol: string | null, timeframe: Timeframe, from: Date, to: Date) {
  return useQuery({
    queryKey: ['candles', symbol, timeframe, from.toISOString(), to.toISOString()],
    queryFn: () => fetchCandles(symbol as string, timeframe, from, to),
    enabled: Boolean(symbol),
  });
}
