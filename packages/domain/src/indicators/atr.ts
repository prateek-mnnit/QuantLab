import type { Candle } from '@quantlab/shared-types';

/**
 * Average True Range, using Wilder's smoothing (the same recurrence style
 * as RSI above). True Range for bar i is the largest of: the bar's own
 * high-low range, the gap up from the previous close, or the gap down from
 * the previous close - this is what makes ATR account for overnight gaps,
 * unlike a plain high-low range. ATR is Wilder's smoothed average of True
 * Range over `period` bars, and is used both as a standalone indicator and
 * by the risk manager for ATR-based stop loss / trailing stop sizing.
 */
export function atr(candles: Candle[], period: number): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period + 1) return result;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]!;
    const previousClose = candles[i - 1]!.close;
    trueRanges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previousClose),
        Math.abs(current.low - previousClose),
      ),
    );
  }

  let avg = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  result[period] = avg;

  for (let i = period + 1; i < candles.length; i++) {
    const trueRange = trueRanges[i - 1]!;
    avg = (avg * (period - 1) + trueRange) / period;
    result[i] = avg;
  }

  return result;
}
