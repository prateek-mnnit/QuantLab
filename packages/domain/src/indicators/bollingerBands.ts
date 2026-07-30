import type { Candle } from '@quantlab/shared-types';
import { sma } from './sma.js';

export interface BollingerBandsResult {
  upperBand: Array<number | null>;
  middleBand: Array<number | null>;
  lowerBand: Array<number | null>;
}

/**
 * Middle band = SMA(period). Upper/lower bands = middle +/- `stdDev`
 * standard deviations of closes, computed over that same rolling window.
 */
export function bollingerBands(
  candles: Candle[],
  period: number,
  stdDevMultiplier: number,
): BollingerBandsResult {
  const middleBand = sma(candles, period);
  const upperBand: Array<number | null> = new Array(candles.length).fill(null);
  const lowerBand: Array<number | null> = new Array(candles.length).fill(null);

  for (let i = period - 1; i < candles.length; i++) {
    const mean = middleBand[i];
    if (mean == null) continue;

    let sumSquaredDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = candles[j]!.close - mean;
      sumSquaredDiff += diff * diff;
    }
    const stdDev = Math.sqrt(sumSquaredDiff / period);

    upperBand[i] = mean + stdDevMultiplier * stdDev;
    lowerBand[i] = mean - stdDevMultiplier * stdDev;
  }

  return { upperBand, middleBand, lowerBand };
}
