import type { Candle } from '@quantlab/shared-types';
import { ema } from './ema.js';

export interface MacdResult {
  macdLine: Array<number | null>;
  signalLine: Array<number | null>;
  histogram: Array<number | null>;
}

/**
 * MACD Line = fast EMA - slow EMA. Signal Line = an EMA of the MACD Line
 * itself over `signalPeriod`. Histogram = MACD Line - Signal Line.
 *
 * The signal line's EMA recurrence is inlined here (rather than reusing
 * `ema()`, which operates on `Candle[]`) since it needs to run over a plain
 * derived number series - wrapping each MACD value back into a fake
 * `Candle` just to reuse the candle-shaped function would be more
 * convoluted than the ~15 lines below.
 */
export function macd(
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): MacdResult {
  const fast = ema(candles, fastPeriod);
  const slow = ema(candles, slowPeriod);

  const macdLine: Array<number | null> = candles.map((_, i) => {
    const f = fast[i]!;
    const s = slow[i]!;
    return f !== null && s !== null ? f - s : null;
  });

  const signalLine: Array<number | null> = new Array(candles.length).fill(null);
  const alpha = 2 / (signalPeriod + 1);
  let seenCount = 0;
  let seedSum = 0;
  let previous: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    const value = macdLine[i];
    if (value == null) continue;
    seenCount += 1;

    if (seenCount < signalPeriod) {
      seedSum += value;
      continue;
    }
    if (seenCount === signalPeriod) {
      seedSum += value;
      previous = seedSum / signalPeriod;
    } else if (previous !== null) {
      previous = value * alpha + previous * (1 - alpha);
    }
    signalLine[i] = previous;
  }

  const histogram: Array<number | null> = candles.map((_, i) => {
    const m = macdLine[i]!;
    const s = signalLine[i]!;
    return m !== null && s !== null ? m - s : null;
  });

  return { macdLine, signalLine, histogram };
}
