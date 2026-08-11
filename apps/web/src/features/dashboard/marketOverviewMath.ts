// NOTE: this file's pure `computeIndexChange` logic is deliberately named
// `marketOverviewMath.ts`, not `marketOverview.ts` - it used to be the
// latter, which differs from this directory's `MarketOverview.tsx` only by
// the first letter's case. That's safe on a case-sensitive filesystem
// (this repo's CI, most Linux dev setups) but NOT on a case-insensitive
// one (macOS/Windows, both very common), where the two paths collide: a
// git checkout or ZIP extraction can silently let one file's content
// overwrite the other's, which is exactly what caused `MarketOverview` to
// resolve to `undefined` at runtime for anyone on such a filesystem. Do
// not rename this back to anything that differs from a component name
// only by case.
import type { Candle } from '@quantlab/shared-types';

export interface IndexChange {
  latestClose: number;
  changePct: number;
}

/**
 * Derives "current value + % change" for a Dashboard Market Overview card
 * from the SAME candle data `ChartPage`/`useCandles` already fetch - no
 * separate "quote" endpoint exists (or is needed): the latest two daily
 * closes are all a % change actually requires. Returns `null` when there
 * isn't enough data to compute a real change (fewer than two candles, or a
 * zero previous close that would make the percentage undefined) rather
 * than showing a misleading 0%/blank value - the caller renders that as an
 * "unavailable" state.
 */
export function computeIndexChange(candles: Candle[]): IndexChange | null {
  if (candles.length < 2) return null;

  // Candles normally arrive already sorted (every MarketDataProvider
  // returns chronological order), but sorting again here means this still
  // gives a correct answer even if a caller ever passes them out of order.
  const sorted = [...candles].sort((a, b) => a.time - b.time);
  const latest = sorted[sorted.length - 1]!;
  const previous = sorted[sorted.length - 2]!;

  if (previous.close === 0) return null;

  return {
    latestClose: latest.close,
    changePct: ((latest.close - previous.close) / previous.close) * 100,
  };
}
