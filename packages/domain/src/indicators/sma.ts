import type { Candle } from '@quantlab/shared-types';

/**
 * Simple Moving Average: the unweighted mean of the last `period` closes.
 * Returns one value per candle - `null` for the first `period - 1` bars,
 * since there isn't enough history yet to compute a valid average. This
 * "warm-up period returns null" convention is used consistently by every
 * indicator in this module; the condition evaluator (see ../conditions)
 * treats `null` as "not yet decidable," never as a false comparison.
 *
 * Implemented as a running sum (add the new bar, subtract the one that just
 * fell out of the window) rather than re-summing the last `period` closes
 * from scratch at every bar - O(n) total instead of O(n * period).
 */
export function sma(candles: Candle[], period: number): Array<number | null> {
  const result: Array<number | null> = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    sum += candles[i]!.close;
    if (i >= period) {
      sum -= candles[i - period]!.close;
    }
    result.push(i >= period - 1 ? sum / period : null);
  }

  return result;
}
