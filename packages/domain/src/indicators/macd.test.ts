import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { macd } from './macd.js';

function candle(close: number): Candle {
  return { time: 0, open: close, high: close, low: close, close, volume: 0 };
}

describe('macd', () => {
  it('is null everywhere until the slow EMA has warmed up, matching fast/slow EMA subtraction', () => {
    // With a flat, constant closing price, every EMA (fast or slow)
    // converges to that same constant once warmed up, so the MACD line
    // (fast - slow) should be exactly 0 the moment both are defined - a
    // simple, hand-verifiable sanity check independent of the exact EMA
    // recurrence math.
    const candles = Array.from({ length: 20 }, () => candle(100));

    const result = macd(candles, 3, 6, 2);

    // Slow EMA(6) warms up at index 5 - MACD line can't exist before that.
    expect(result.macdLine.slice(0, 5)).toEqual(new Array(5).fill(null));
    expect(result.macdLine[5]).toBe(0);
    expect(result.macdLine[19]).toBe(0);
  });

  it('matches values computed independently from the standard fast-EMA-minus-slow-EMA / EMA-of-MACD-line formula', () => {
    // Expected values below were computed with a second, independently
    // written reference implementation of the same standard MACD formula
    // (SMA-seeded EMA for both the fast/slow lines and the signal line),
    // run against this exact closing-price series - cross-checking the
    // production implementation rather than asserting its own output back
    // at itself.
    const closes = [
      22.27, 22.19, 22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29, 22.15, 22.39, 22.38, 22.61,
      23.36, 24.05, 23.75, 23.83, 23.95, 23.63, 23.82, 23.87, 23.65, 23.19, 23.1, 23.33, 22.68, 23.1,
      22.4, 22.17, 22.42, 22.61, 23.35, 23.72, 24.02, 23.6, 23.9,
    ];

    const result = macd(closes.map(candle), 5, 10, 4);

    // Fast EMA(5) and slow EMA(10) both need to warm up before the MACD
    // line exists - the slow one is the binding constraint (index 9).
    expect(result.macdLine.slice(0, 9)).toEqual(new Array(9).fill(null));
    expect(result.macdLine[9]).toBeCloseTo(0.0474, 4);
    expect(result.macdLine[20]).toBeCloseTo(0.2806, 4);
    expect(result.macdLine[36]).toBeCloseTo(0.2251, 4);

    // The signal line needs `signalPeriod` (4) non-null MACD values before
    // it exists - MACD line goes non-null at index 9, so the signal line's
    // SMA-seed lands 3 bars later, at index 12.
    expect(result.signalLine.slice(0, 12)).toEqual(new Array(12).fill(null));
    expect(result.signalLine[12]).toBeCloseTo(0.0396, 4);
    expect(result.signalLine[20]).toBeCloseTo(0.3144, 4);
    expect(result.signalLine[36]).toBeCloseTo(0.1578, 4);

    // Histogram is just macdLine - signalLine at every bar where both exist.
    expect(result.histogram[20]).toBeCloseTo(result.macdLine[20]! - result.signalLine[20]!, 10);
    expect(result.histogram[36]).toBeCloseTo(result.macdLine[36]! - result.signalLine[36]!, 10);
  });
});
