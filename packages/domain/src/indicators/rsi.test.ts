import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { rsi } from './rsi.js';

function candle(close: number): Candle {
  return { time: 0, open: close, high: close, low: close, close, volume: 0 };
}

describe('rsi', () => {
  it('is 100 when every change in the lookback window is a gain', () => {
    const closes = Array.from({ length: 15 }, (_, i) => i + 1); // strictly increasing
    expect(rsi(closes.map(candle), 14)[14]).toBe(100);
  });

  it('stays within the valid 0-100 range on mixed up/down data', () => {
    const closes = [10, 10.5, 10.2, 10.8, 10.6, 11, 10.9, 11.2, 11.5, 11.3, 11.6, 11.8, 11.7, 12, 12.2];
    const value = rsi(closes.map(candle), 14)[14];
    expect(value).not.toBeNull();
    expect(value as number).toBeGreaterThanOrEqual(0);
    expect(value as number).toBeLessThanOrEqual(100);
  });
});
