import type { StrategyInput } from '../schemas/strategy.schema.js';

/**
 * Group AB: built-in strategy templates.
 *
 * This is METADATA ONLY, following the exact precedent set by
 * `INDICATOR_CATALOG` in `./indicator-catalog.ts`: static reference data
 * that both `apps/web` (to populate a template picker) and `apps/api` (to
 * prove, in a unit test, that every template is and remains valid) import
 * directly from this shared package - no new API endpoint, no database
 * table, no per-user state. A GET endpoint would just be a network round
 * trip to fetch a constant that never changes at runtime and isn't
 * user-specific; `INDICATOR_CATALOG` already established that pattern isn't
 * how this codebase exposes this kind of data.
 *
 * Each template's `input` is a complete, ready-to-submit `StrategyInput` -
 * the exact type `POST /api/strategies` and `PUT /api/strategies/:id`
 * already accept (see strategy.schema.ts) - so applying a template is
 * nothing more than replacing the draft wholesale with `input` and handing
 * it to the SAME create/update flow every hand-built strategy already goes
 * through. No new validation path, no new persistence path: a template is
 * just a good starting point for the existing `StrategyInput` model.
 *
 * "Blank Strategy" (start from scratch, today's default behavior) is
 * intentionally NOT one of these entries: it has no `StrategyInput` to
 * offer, it's simply resetting to the existing empty draft the app already
 * starts new strategies with. It's handled as a plain UI choice in the
 * frontend's template picker, not as data here - every entry in this array
 * is expected to be a genuine, fully-valid strategy, which the backend unit
 * test in `apps/api/src/application/strategies/StrategyTemplates.test.ts`
 * enforces for every one of them.
 */
export interface StrategyTemplate {
  /** Stable, URL/DOM-safe identifier - e.g. used as the template picker's option value and React key. */
  id: string;
  name: string;
  description: string;
  input: StrategyInput;
}

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: 'sma-crossover',
    name: 'SMA Crossover',
    description:
      'Buy when the fast SMA crosses above the slow SMA (a "golden cross"), and exit on the opposite cross.',
    input: {
      name: 'SMA Crossover',
      description:
        'A classic trend-following setup: enter on a golden cross (10-period SMA crossing above the 50-period SMA), exit on a death cross (the reverse).',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'sma-crossover-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'sma-crossover-entry-1',
            left: { source: 'INDICATOR', indicator: 'SMA', params: { period: 10 } },
            operator: 'CROSSES_ABOVE',
            right: { source: 'INDICATOR', indicator: 'SMA', params: { period: 50 } },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'sma-crossover-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'sma-crossover-exit-1',
            left: { source: 'INDICATOR', indicator: 'SMA', params: { period: 10 } },
            operator: 'CROSSES_BELOW',
            right: { source: 'INDICATOR', indicator: 'SMA', params: { period: 50 } },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 5 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'rsi-reversal',
    name: 'RSI Reversal',
    description: 'Buy when RSI drops into oversold territory, and exit once it climbs back into overbought territory.',
    input: {
      name: 'RSI Reversal',
      description:
        'A momentum-reversal setup: enter when the 14-period RSI drops below 30 (oversold), exit once it climbs above 70 (overbought).',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'rsi-reversal-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'rsi-reversal-entry-1',
            left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
            operator: 'LESS_THAN',
            right: { source: 'VALUE', value: 30 },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'rsi-reversal-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'rsi-reversal-exit-1',
            left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
            operator: 'GREATER_THAN',
            right: { source: 'VALUE', value: 70 },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 5 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'macd-trend-following',
    name: 'MACD Trend Following',
    description: 'Buy when the MACD line crosses above its signal line, and exit on the opposite cross.',
    input: {
      name: 'MACD Trend Following',
      description:
        'Enter when the MACD line crosses above its signal line (bullish momentum shift), exit on the reverse cross. A trailing stop lets a strong trend run.',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'macd-trend-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'macd-trend-entry-1',
            left: {
              source: 'INDICATOR',
              indicator: 'MACD',
              params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
              output: 'macdLine',
            },
            operator: 'CROSSES_ABOVE',
            right: {
              source: 'INDICATOR',
              indicator: 'MACD',
              params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
              output: 'signalLine',
            },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'macd-trend-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'macd-trend-exit-1',
            left: {
              source: 'INDICATOR',
              indicator: 'MACD',
              params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
              output: 'macdLine',
            },
            operator: 'CROSSES_BELOW',
            right: {
              source: 'INDICATOR',
              indicator: 'MACD',
              params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
              output: 'signalLine',
            },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 7 },
      takeProfitConfig: null,
      trailingStopConfig: { type: 'PERCENT', value: 5 },
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'bollinger-mean-reversion',
    name: 'Bollinger Mean Reversion',
    description:
      'Buy when price closes below the lower Bollinger Band, and exit once it reverts back to the middle band.',
    input: {
      name: 'Bollinger Mean Reversion',
      description:
        'Fades short-term extremes: enter when the close drops below the lower Bollinger Band, exit once price reverts to the middle band (the moving average).',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'bollinger-reversion-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'bollinger-reversion-entry-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'LESS_THAN',
            right: {
              source: 'INDICATOR',
              indicator: 'BOLLINGER_BANDS',
              params: { period: 20, stdDev: 2 },
              output: 'lowerBand',
            },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'bollinger-reversion-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'bollinger-reversion-exit-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'GREATER_THAN',
            right: {
              source: 'INDICATOR',
              indicator: 'BOLLINGER_BANDS',
              params: { period: 20, stdDev: 2 },
              output: 'middleBand',
            },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 4 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description:
      'Buy when price closes above the upper Bollinger Band on expanding volatility, and exit if it falls back below the middle band.',
    input: {
      name: 'Breakout',
      description:
        'Enter on a volatility breakout above the upper Bollinger Band, exit if momentum fades and price falls back below the middle band. Uses ATR-based stops since breakout risk scales with volatility, not a fixed percentage.',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'breakout-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'breakout-entry-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'CROSSES_ABOVE',
            right: {
              source: 'INDICATOR',
              indicator: 'BOLLINGER_BANDS',
              params: { period: 20, stdDev: 2 },
              output: 'upperBand',
            },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'breakout-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'breakout-exit-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'CROSSES_BELOW',
            right: {
              source: 'INDICATOR',
              indicator: 'BOLLINGER_BANDS',
              params: { period: 20, stdDev: 2 },
              output: 'middleBand',
            },
          },
        ],
      },
      stopLossConfig: { type: 'ATR', value: 2 },
      takeProfitConfig: null,
      trailingStopConfig: { type: 'ATR', value: 3 },
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
];
