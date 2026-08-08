import type { Candle } from '@quantlab/shared-types';

/**
 * Yahoo Finance's chart API has no native 4-hour interval - its documented
 * intraday intervals are 1m/2m/5m/15m/30m/60m/90m only. Rather than
 * treating "4 Hours" as unsupported, `YahooFinanceProvider` fetches the
 * next interval down it DOES support (60m) and rolls every 4 consecutive
 * hourly bars up into one - a pure, provider-agnostic transform that lives
 * here (not inside `YahooFinanceProvider`) since it has nothing to do with
 * Yahoo's response shape, just generic OHLCV bucketing.
 *
 * Buckets are aligned to fixed `bucketSeconds`-wide windows on the Unix
 * epoch (`floor(time / bucketSeconds) * bucketSeconds`), not to exchange
 * session open - a known simplification: a 4-hour bucket can therefore
 * straddle a session boundary rather than always starting exactly at market
 * open. That's an acceptable tradeoff for a "roughly 4-hour candle" view
 * (the goal here), not a claim of exchange-session-aligned bars.
 */
export function aggregateCandles(candles: Candle[], bucketSeconds: number): Candle[] {
  if (candles.length === 0) return [];

  const buckets = new Map<number, Candle[]>();
  for (const candle of candles) {
    const bucketStart = Math.floor(candle.time / bucketSeconds) * bucketSeconds;
    const existing = buckets.get(bucketStart);
    if (existing) {
      existing.push(candle);
    } else {
      buckets.set(bucketStart, [candle]);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, bucketCandles]) => {
      // Source candles usually arrive already sorted (Yahoo returns them in
      // chronological order), but sorting again here makes open/close
      // correct even if a caller passes bars out of order.
      const sorted = bucketCandles.slice().sort((a, b) => a.time - b.time);
      return {
        time: bucketStart,
        open: sorted[0]!.open,
        high: Math.max(...sorted.map((c) => c.high)),
        low: Math.min(...sorted.map((c) => c.low)),
        close: sorted[sorted.length - 1]!.close,
        volume: sorted.reduce((sum, c) => sum + c.volume, 0),
      };
    });
}

/** Bucket width for the "4 Hours" timeframe, in seconds - the only aggregated timeframe today. */
export const FOUR_HOURS_SECONDS = 4 * 60 * 60;
