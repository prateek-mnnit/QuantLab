import type { Candle, SymbolResult, Timeframe } from '@quantlab/shared-types';
import { apiRequest } from '../../lib/api-client';

export function searchSymbols(query: string): Promise<SymbolResult[]> {
  const params = new URLSearchParams({ q: query });
  return apiRequest<SymbolResult[]>(`/symbols/search?${params.toString()}`);
}

export function fetchCandles(
  symbol: string,
  timeframe: Timeframe,
  from: Date,
  to: Date,
): Promise<Candle[]> {
  const params = new URLSearchParams({
    timeframe,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  });
  return apiRequest<Candle[]>(`/market-data/${encodeURIComponent(symbol)}/candles?${params.toString()}`);
}
