import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { aggregateCandles, FOUR_HOURS_SECONDS } from './aggregateCandles.js';

function candle(time: number, overrides: Partial<Candle> = {}): Candle {
  return { time, open: 100, high: 100, low: 100, close: 100, volume: 10, ...overrides };
}

describe('aggregateCandles', () => {
  it('returns an empty array for no input candles', () => {
    expect(aggregateCandles([], FOUR_HOURS_SECONDS)).toEqual([]);
  });

  it('merges candles falling in the same bucket into one OHLCV bar', () => {
    const bucketStart = 0;
    const bars = [
      candle(bucketStart, { open: 10, high: 12, low: 9, close: 11, volume: 100 }),
      candle(bucketStart + 3600, { open: 11, high: 15, low: 10, close: 14, volume: 200 }),
      candle(bucketStart + 7200, { open: 14, high: 14, low: 8, close: 9, volume: 50 }),
    ];

    const result = aggregateCandles(bars, FOUR_HOURS_SECONDS);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      time: bucketStart,
      open: 10, // from the first bar in the bucket
      high: 15, // max across all three
      low: 8, // min across all three
      close: 9, // from the last bar in the bucket
      volume: 350, // summed
    });
  });

  it('splits candles into separate buckets once bucketSeconds is exceeded', () => {
    const bars = [
      candle(0, { close: 1 }),
      candle(3 * 3600, { close: 2 }),
      candle(4 * 3600, { close: 3 }), // falls into the NEXT 4-hour bucket
      candle(7 * 3600, { close: 4 }),
    ];

    const result = aggregateCandles(bars, FOUR_HOURS_SECONDS);

    expect(result).toHaveLength(2);
    expect(result[0]!.time).toBe(0);
    expect(result[0]!.close).toBe(2);
    expect(result[1]!.time).toBe(4 * 3600);
    expect(result[1]!.close).toBe(4);
  });

  it('sorts buckets chronologically regardless of input order', () => {
    const bars = [candle(8 * 3600), candle(0), candle(4 * 3600)];

    const result = aggregateCandles(bars, FOUR_HOURS_SECONDS);

    expect(result.map((c) => c.time)).toEqual([0, 4 * 3600, 8 * 3600]);
  });

  it('sorts out-of-order candles within a single bucket before deriving open/close', () => {
    const bucketStart = 0;
    const bars = [
      candle(bucketStart + 1800, { open: 20, close: 25 }), // arrives first but is chronologically LATER
      candle(bucketStart, { open: 10, close: 15 }),
    ];

    const result = aggregateCandles(bars, FOUR_HOURS_SECONDS);

    expect(result[0]!.open).toBe(10); // from the chronologically first bar
    expect(result[0]!.close).toBe(25); // from the chronologically last bar
  });
});
