import type { Candle } from '@quantlab/shared-types';
import { sma } from './sma.js';

/**
 * Exponential Moving Average: weights recent closes more heavily than
 * older ones via a smoothing factor `alpha = 2 / (period + 1)`. Seeded
 * with a plain SMA over the first `period` bars (the standard convention),
 * then recurred forward: EMA[i] = close[i] * alpha + EMA[i-1] * (1 - alpha).
 */
export function ema(candles: Candle[], period: number): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  const seed = sma(candles, period);
  const alpha = 2 / (period + 1);
  let previous: number | null = null;

  for (let i = period - 1; i < candles.length; i++) {
    if (i === period - 1) {
      previous = seed[i] ?? null;
    } else if (previous !== null) {
      previous = candles[i]!.close * alpha + previous * (1 - alpha);
    }
    result[i] = previous;
  }

  return result;
}
