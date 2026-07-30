import type { Candle } from '@quantlab/shared-types';

/**
 * Relative Strength Index, using Wilder's original smoothing method (the
 * textbook/standard definition - not a plain moving average of gains and
 * losses). Tracks the average magnitude of up-moves vs. down-moves over
 * `period` bars, expressed as an oscillator from 0-100: values above ~70
 * are conventionally read as overbought, below ~30 as oversold.
 */
export function rsi(candles: Candle[], period: number): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i]!.close - candles[i - 1]!.close;
    avgGain += Math.max(change, 0);
    avgLoss += Math.max(-change, 0);
  }
  avgGain /= period;
  avgLoss /= period;
  result[period] = rsiFromAverages(avgGain, avgLoss);

  // Wilder's smoothing: each new average is a weighted blend of the prior
  // average and the current bar's gain/loss, weighted by `period` - an
  // EMA-like recurrence, not a fresh average recomputed from a rolling window.
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i]!.close - candles[i - 1]!.close;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = rsiFromAverages(avgGain, avgLoss);
  }

  return result;
}

function rsiFromAverages(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const relativeStrength = avgGain / avgLoss;
  return 100 - 100 / (1 + relativeStrength);
}
