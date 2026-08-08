import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { ema } from './ema.js';

function candle(close: number): Candle {
  return { time: 0, open: close, high: close, low: close, close, volume: 0 };
}

describe('ema', () => {
  it('returns null during the warm-up period, seeded by an SMA, then the correct exponential average', () => {
    // period 3 -> alpha = 2/(3+1) = 0.5. Seed (bar index 2) is a plain
    // SMA(3) = (1+2+3)/3 = 2, then each later bar recurs:
    // ema[i] = close[i]*0.5 + ema[i-1]*0.5.
    const candles = [1, 2, 3, 4, 5].map(candle);

    expect(ema(candles, 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('matches values computed from the standard EMA formula on a real closing-price series', () => {
    // A real-world-shaped closing-price series (drawn from a widely-used
    // SMA/EMA worked example), with expected values computed independently
    // via the standard formula (SMA-seeded EMA, alpha = 2/(period+1)) -
    // not just re-deriving whatever this implementation happens to output.
    const closes = [
      22.27, 22.19, 22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29, 22.15, 22.39, 22.38, 22.61,
      23.36, 24.05, 23.75, 23.83, 23.95, 23.63, 23.82, 23.87, 23.65, 23.19, 23.1, 23.33, 22.68, 23.1,
      22.4, 22.17,
    ];

    const result = ema(closes.map(candle), 10);

    // First 9 bars are warm-up (need `period` closes before the SMA seed exists).
    expect(result.slice(0, 9)).toEqual(new Array(9).fill(null));
    // Index 9: the SMA(10) seed - the mean of the first 10 closes.
    expect(result[9]).toBeCloseTo(22.221, 3);
    expect(result[14]).toBeCloseTo(22.5164, 3);
    expect(result[19]).toBeCloseTo(23.3398, 3);
    expect(result[29]).toBeCloseTo(22.915, 3);
  });

  it('reacts more to recent price changes than an SMA would, given a late spike', () => {
    // Flat at 10 for a while, then one sharp spike to 20 on the last bar.
    // An SMA(5) would only partially reflect the spike (it's just one of
    // five equally-weighted inputs); EMA(5) weights the most recent bar
    // heavily (alpha = 2/6 = 0.333), so it should land noticeably closer
    // to the spike itself than the SMA does.
    const closes = [10, 10, 10, 10, 10, 20];
    const smaValue = (10 + 10 + 10 + 10 + 20) / 5; // 12
    const emaValue = ema(closes.map(candle), 5)[5]!;

    expect(emaValue).toBeGreaterThan(smaValue);
  });
});
