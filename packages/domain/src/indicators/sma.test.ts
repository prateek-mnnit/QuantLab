import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { sma } from './sma.js';

function candle(close: number): Candle {
  return { time: 0, open: close, high: close, low: close, close, volume: 0 };
}

describe('sma', () => {
  it('returns null during the warm-up period, then the correct rolling average', () => {
    const candles = [1, 2, 3, 4, 5].map(candle);
    expect(sma(candles, 3)).toEqual([null, null, 2, 3, 4]);
  });
});
