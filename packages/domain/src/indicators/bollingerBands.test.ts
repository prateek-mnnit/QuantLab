import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { bollingerBands } from './bollingerBands.js';

function candle(close: number): Candle {
  return { time: 0, open: close, high: close, low: close, close, volume: 0 };
}

describe('bollingerBands', () => {
  it('returns null during the warm-up period, then a middle band equal to the SMA plus/minus the population standard deviation', () => {
    // closes 1..5, period 5: mean = 3, population variance =
    // ((1-3)^2+(2-3)^2+0+(4-3)^2+(5-3)^2)/5 = 10/5 = 2, stdDev = sqrt(2).
    const candles = [1, 2, 3, 4, 5].map(candle);

    const result = bollingerBands(candles, 5, 2);

    expect(result.middleBand).toEqual([null, null, null, null, 3]);
    expect(result.upperBand[4]).toBeCloseTo(3 + 2 * Math.sqrt(2), 10);
    expect(result.lowerBand[4]).toBeCloseTo(3 - 2 * Math.sqrt(2), 10);
  });

  it('collapses the bands to the middle band (zero width) when every close in the window is identical', () => {
    // Zero variance -> stdDev 0 -> upper/lower band both equal the mean,
    // regardless of the stdDev multiplier - a useful edge-case check since
    // it isolates "is the stdDev computation actually reacting to spread"
    // from "is the mean right".
    const candles = Array.from({ length: 5 }, () => candle(50));

    const result = bollingerBands(candles, 5, 2);

    expect(result.upperBand[4]).toBe(50);
    expect(result.middleBand[4]).toBe(50);
    expect(result.lowerBand[4]).toBe(50);
  });

  it('widens the bands as the stdDev multiplier increases, for the same underlying data', () => {
    const candles = [1, 2, 3, 4, 5].map(candle);

    const narrow = bollingerBands(candles, 5, 1);
    const wide = bollingerBands(candles, 5, 3);

    expect(wide.upperBand[4]!).toBeGreaterThan(narrow.upperBand[4]!);
    expect(wide.lowerBand[4]!).toBeLessThan(narrow.lowerBand[4]!);
    // The middle band never depends on the multiplier.
    expect(wide.middleBand[4]).toBe(narrow.middleBand[4]);
  });
});
