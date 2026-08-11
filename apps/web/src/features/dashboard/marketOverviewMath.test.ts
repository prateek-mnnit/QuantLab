import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { computeIndexChange } from './marketOverviewMath.js';

function candle(time: number, close: number): Candle {
  return { time, open: close, high: close, low: close, close, volume: 1000 };
}

describe('computeIndexChange', () => {
  it('returns null when there are fewer than two candles', () => {
    expect(computeIndexChange([])).toBeNull();
    expect(computeIndexChange([candle(0, 100)])).toBeNull();
  });

  it('computes latestClose and changePct from the last two candles', () => {
    const result = computeIndexChange([candle(0, 100), candle(1, 110)]);

    expect(result).toEqual({ latestClose: 110, changePct: 10 });
  });

  it('produces a negative changePct when the latest close is lower', () => {
    const result = computeIndexChange([candle(0, 100), candle(1, 95)]);

    expect(result?.changePct).toBeCloseTo(-5, 5);
  });

  it('sorts out-of-order candles before comparing the last two', () => {
    const result = computeIndexChange([candle(5, 120), candle(0, 100)]);

    // Chronologically: 100 -> 120, a +20% change - NOT the -16.67% you'd
    // get by treating input order as chronological order.
    expect(result).toEqual({ latestClose: 120, changePct: 20 });
  });

  it('returns null instead of dividing by zero when the previous close was 0', () => {
    expect(computeIndexChange([candle(0, 0), candle(1, 100)])).toBeNull();
  });

  it('uses only the last two candles when more are provided', () => {
    const result = computeIndexChange([candle(0, 50), candle(1, 200), candle(2, 100), candle(3, 110)]);

    expect(result).toEqual({ latestClose: 110, changePct: 10 });
  });
});
