import type { Candle, IndicatorType } from '@quantlab/shared-types';
import { sma } from './sma.js';
import { ema } from './ema.js';
import { rsi } from './rsi.js';
import { atr } from './atr.js';
import { macd } from './macd.js';
import { bollingerBands } from './bollingerBands.js';

/**
 * The single dispatch point every consumer (the condition evaluator, and
 * the backtest engine's own ATR-for-risk lookup) calls through, rather than
 * importing individual indicator functions and switching on type
 * themselves. Its output keys match `INDICATOR_CATALOG`'s `outputs` from
 * shared-types exactly (e.g. MACD -> `{ macdLine, signalLine, histogram }`)
 * - that catalog is what the strategy builder UI's dropdowns are generated
 * from, so keeping this dispatcher's keys in lockstep with it is what
 * guarantees a condition referencing `output: "signalLine"` always resolves
 * to something real.
 */
export function calculateIndicator(
  candles: Candle[],
  indicator: IndicatorType,
  params: Record<string, number>,
): Record<string, Array<number | null>> {
  switch (indicator) {
    case 'SMA':
      return { value: sma(candles, params.period ?? 20) };
    case 'EMA':
      return { value: ema(candles, params.period ?? 20) };
    case 'RSI':
      return { value: rsi(candles, params.period ?? 14) };
    case 'ATR':
      return { value: atr(candles, params.period ?? 14) };
    case 'MACD':
      return { ...macd(candles, params.fastPeriod ?? 12, params.slowPeriod ?? 26, params.signalPeriod ?? 9) };
    case 'BOLLINGER_BANDS':
      return { ...bollingerBands(candles, params.period ?? 20, params.stdDev ?? 2) };
    default: {
      // Exhaustiveness check: if a new IndicatorType is ever added to
      // shared-types' INDICATOR_CATALOG without a matching case here, this
      // fails to COMPILE rather than silently returning nothing at runtime.
      const exhaustiveCheck: never = indicator;
      throw new Error(`Unsupported indicator: ${String(exhaustiveCheck)}`);
    }
  }
}
