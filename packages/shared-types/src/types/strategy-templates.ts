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
 *
 * Group AH added the five entries below `breakout` (EMA/RSI/SMA-based
 * trend and crossover strategies) so this same array could double as the
 * source of QuantLab's seeded "Built-in Strategies" - the demo seed script
 * (`apps/api/src/scripts/seedDemoData.ts`) creates one real, persisted
 * Strategy row per entry here for the demo account, rather than defining a
 * second, parallel list of "demo strategies" with its own content to keep
 * in sync. `Donchian Channel Breakout` was in Group AH's original target
 * list but was dropped: `INDICATOR_CATALOG` has no Donchian Channel
 * indicator, and adding one would mean extending the indicator catalog and
 * the domain calculation engine - explicitly out of scope for a
 * demo-content group. `Triple EMA Trend Strategy` was chosen as a
 * recognizable, catalog-supported replacement instead.
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
  {
    id: 'ema-trend-following',
    name: '21 EMA Trend Following',
    description:
      'Buy when price closes above the 21-period EMA (an emerging uptrend), and exit once it closes back below it.',
    input: {
      name: '21 EMA Trend Following',
      description:
        'A simple, widely-used trend-following setup: enter when the close crosses above the 21-period EMA, exit when it crosses back below - stays in the trade only while price is above its trend line.',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'ema-trend-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'ema-trend-entry-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'CROSSES_ABOVE',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'ema-trend-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'ema-trend-exit-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'CROSSES_BELOW',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 6 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'ema-9-21-crossover',
    name: 'EMA 9/21 Crossover',
    description: 'A faster trend-following setup: buy when the 9-period EMA crosses above the 21-period EMA, and exit on the reverse cross.',
    input: {
      name: 'EMA 9/21 Crossover',
      description:
        'Enter when the fast 9-period EMA crosses above the slower 21-period EMA (short-term momentum turning up), exit on the reverse cross.',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'ema-9-21-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'ema-9-21-entry-1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 9 } },
            operator: 'CROSSES_ABOVE',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'ema-9-21-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'ema-9-21-exit-1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 9 } },
            operator: 'CROSSES_BELOW',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
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
    id: 'sma-50-200-golden-cross',
    name: 'SMA 50/200 Golden Cross',
    description:
      'The classic long-term golden cross: buy when the 50-period SMA crosses above the 200-period SMA, and exit on a death cross (the reverse).',
    input: {
      name: 'SMA 50/200 Golden Cross',
      description:
        'A long-horizon trend-following setup: enter on a golden cross (50-period SMA crossing above the 200-period SMA), exit on a death cross (the reverse). A wider stop reflects the longer holding period this setup expects.',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'golden-cross-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'golden-cross-entry-1',
            left: { source: 'INDICATOR', indicator: 'SMA', params: { period: 50 } },
            operator: 'CROSSES_ABOVE',
            right: { source: 'INDICATOR', indicator: 'SMA', params: { period: 200 } },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'golden-cross-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'golden-cross-exit-1',
            left: { source: 'INDICATOR', indicator: 'SMA', params: { period: 50 } },
            operator: 'CROSSES_BELOW',
            right: { source: 'INDICATOR', indicator: 'SMA', params: { period: 200 } },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 10 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'rsi-ema-trend-filter',
    name: 'RSI + EMA Trend Filter',
    description:
      'Combines trend and momentum: buy only when price is above the 21-period EMA AND RSI(14) is above 50, exit if either condition breaks down.',
    input: {
      name: 'RSI + EMA Trend Filter',
      description:
        'A momentum-confirmed trend setup: enter only when the close is above the 21-period EMA (an uptrend) AND RSI(14) is above 50 (momentum agrees), exit as soon as either the trend breaks (close below the EMA) OR momentum fades (RSI below 45).',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'rsi-ema-filter-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'rsi-ema-filter-entry-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'GREATER_THAN',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
          {
            type: 'CONDITION',
            id: 'rsi-ema-filter-entry-2',
            left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
            operator: 'GREATER_THAN',
            right: { source: 'VALUE', value: 50 },
          },
        ],
      },
      exitConditions: {
        type: 'OR',
        id: 'rsi-ema-filter-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'rsi-ema-filter-exit-1',
            left: { source: 'PRICE', field: 'close' },
            operator: 'LESS_THAN',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
          {
            type: 'CONDITION',
            id: 'rsi-ema-filter-exit-2',
            left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
            operator: 'LESS_THAN',
            right: { source: 'VALUE', value: 45 },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 6 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
  {
    id: 'triple-ema-trend',
    name: 'Triple EMA Trend Strategy',
    description:
      'A stricter trend-alignment setup: buy only when the 9, 21, and 50-period EMAs are stacked bullishly, and exit as soon as the 9-period EMA crosses back below the 21-period EMA.',
    input: {
      name: 'Triple EMA Trend Strategy',
      description:
        'Enters only when three EMAs confirm a strong uptrend together (9-period above 21-period, AND 21-period above 50-period), exits as soon as short-term momentum rolls over (9-period EMA crossing below the 21-period EMA).',
      timeframe: '1D',
      entryConditions: {
        type: 'AND',
        id: 'triple-ema-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'triple-ema-entry-1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 9 } },
            operator: 'GREATER_THAN',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
          {
            type: 'CONDITION',
            id: 'triple-ema-entry-2',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
            operator: 'GREATER_THAN',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 50 } },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'triple-ema-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'triple-ema-exit-1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 9 } },
            operator: 'CROSSES_BELOW',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 21 } },
          },
        ],
      },
      stopLossConfig: { type: 'PERCENT', value: 7 },
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'PERCENT_CAPITAL', value: 10 },
    },
  },
];
