import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { atr } from './atr.js';

function candle(high: number, low: number, close: number): Candle {
  return { time: 0, open: close, high, low, close, volume: 0 };
}

describe('atr', () => {
  it('returns null during the warm-up period, then the correct average true range on constant-range bars', () => {
    // Every bar has the exact same 10-point high-low range and no gaps
    // (close always lands mid-range), so true range is exactly 10 on every
    // bar - ATR should converge to exactly 10 as soon as the warm-up
    // window is filled, and stay exactly 10 afterward (Wilder smoothing of
    // a constant series is that same constant).
    const candles = Array.from({ length: 8 }, () => candle(105, 95, 100));

    const result = atr(candles, 5);

    expect(result.slice(0, 5)).toEqual(new Array(5).fill(null));
    expect(result.slice(5)).toEqual([10, 10, 10]);
  });

  it('accounts for an overnight gap, not just the current bar\'s high-low range', () => {
    // Six flat bars (range 5, no gaps) establish an ATR of exactly 5, then
    // bar 7 gaps up hard: its own high-low range is only 1, but the true
    // range must use the gap from the prior close instead, since that's
    // the larger, more meaningful move.
    const flatBars = Array.from({ length: 6 }, () => candle(100, 95, 98));
    const gapBar = candle(105, 104, 104.5); // range=1, but gap from prior close (98) is 6-7
    const candles = [...flatBars, gapBar];

    const result = atr(candles, 5);

    // True range for the gap bar = max(105-104, |105-98|, |104-98|) = max(1, 7, 6) = 7.
    // ATR = (5*4 + 7) / 5 = 5.4 (Wilder smoothing of the prior average of 5).
    expect(result[5]).toBe(5);
    expect(result[6]).toBeCloseTo(5.4);
  });

  it('returns all nulls when there are fewer than period + 1 candles', () => {
    const candles = [candle(105, 95, 100), candle(105, 95, 100)];

    expect(atr(candles, 5)).toEqual([null, null]);
  });
});
