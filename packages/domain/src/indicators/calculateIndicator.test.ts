import { describe, expect, it } from 'vitest';
import type { Candle, IndicatorType } from '@quantlab/shared-types';
import { INDICATOR_CATALOG, INDICATOR_TYPES } from '@quantlab/shared-types';
import { calculateIndicator } from './calculateIndicator.js';

function candle(close: number, high = close, low = close): Candle {
  return { time: 0, open: close, high, low, close, volume: 0 };
}

/** 40 bars of gently varying, always-defined data - enough warm-up room for every indicator's default period, including MACD's slowPeriod(26) + signalPeriod(9) - 1 = 34-bar minimum before its signal line goes non-null. */
function sampleCandles(): Candle[] {
  return Array.from({ length: 40 }, (_, i) => {
    const close = 100 + Math.sin(i / 3) * 5;
    return candle(close, close + 1, close - 1);
  });
}

describe('calculateIndicator', () => {
  it.each(INDICATOR_TYPES)('dispatches %s using each param\'s default value, and its output keys match INDICATOR_CATALOG exactly', (indicator: IndicatorType) => {
    const definition = INDICATOR_CATALOG[indicator];
    const params = Object.fromEntries(definition.params.map((param) => [param.key, param.defaultValue]));

    const result = calculateIndicator(sampleCandles(), indicator, params);

    // This is exactly what evaluateOperand (../conditions/evaluateConditionTree.ts)
    // relies on: `operand.output` (or the first key, for single-output
    // indicators) must be a real key in whatever calculateIndicator
    // returns. If the catalog's `outputs` and the dispatcher's actual
    // return shape ever drift apart, a condition referencing e.g.
    // `output: "signalLine"` would silently resolve to `undefined` at
    // every bar instead of failing loudly - this test is what catches
    // that drift immediately, for every indicator, rather than only
    // noticing it when a specific strategy misbehaves.
    const expectedKeys = definition.outputs.map((output) => output.key).sort();
    expect(Object.keys(result).sort()).toEqual(expectedKeys);
  });

  it.each(INDICATOR_TYPES)('produces at least one non-null %s value once past the warm-up period', (indicator: IndicatorType) => {
    const definition = INDICATOR_CATALOG[indicator];
    const params = Object.fromEntries(definition.params.map((param) => [param.key, param.defaultValue]));

    const result = calculateIndicator(sampleCandles(), indicator, params);

    for (const output of definition.outputs) {
      expect(result[output.key]!.some((value) => value !== null)).toBe(true);
    }
  });

  it('falls back to each param\'s documented default when a param is omitted', () => {
    // e.g. `calculateIndicator(candles, 'SMA', {})` - the strategy input
    // schema requires *a* params object, but individual keys are only
    // enforced by the frontend's default-filled dropdowns, not by the
    // dispatcher, so it needs its own `?? default` for every param
    // (matching how `params.period ?? 20` etc. is written in
    // calculateIndicator.ts itself).
    const candles = sampleCandles();

    const withNoParams = calculateIndicator(candles, 'SMA', {});
    const withExplicitDefault = calculateIndicator(candles, 'SMA', { period: 20 });

    expect(withNoParams).toEqual(withExplicitDefault);
  });

  it('rejects an indicator type that is not one of the six in INDICATOR_TYPES', () => {
    expect(() => calculateIndicator(sampleCandles(), 'NOT_A_REAL_INDICATOR' as IndicatorType, {})).toThrow(
      /Unsupported indicator/,
    );
  });
});
