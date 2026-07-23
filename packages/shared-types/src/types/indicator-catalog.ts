/**
 * The approved Phase 1 indicator set: SMA, EMA, RSI, MACD, Bollinger Bands,
 * ATR. This file is METADATA ONLY - names, parameters, and what values an
 * indicator produces - not calculation logic. The actual math (a rolling
 * RSI calculation, etc.) belongs in the domain engine, which doesn't exist
 * until Phase 3's backtest engine. Putting the catalog here now is what lets
 * the strategy builder UI populate real dropdowns/param inputs, and lets
 * the backend validate a submitted condition tree references a real
 * indicator with valid parameters - both without knowing how to compute it
 * yet.
 */

export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BOLLINGER_BANDS' | 'ATR';

export interface IndicatorParamDefinition {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
}

export interface IndicatorOutputDefinition {
  /** Key used in a condition's `output` field, e.g. "macdLine". */
  key: string;
  label: string;
}

export interface IndicatorDefinition {
  type: IndicatorType;
  label: string;
  description: string;
  params: IndicatorParamDefinition[];
  /**
   * Most indicators (SMA, EMA, RSI, ATR) produce a single number per bar,
   * so `outputs` has one entry. Multi-line indicators (MACD, Bollinger
   * Bands) expose several - a condition referencing them must pick one via
   * its `output` field.
   */
  outputs: IndicatorOutputDefinition[];
}

export const INDICATOR_CATALOG: Record<IndicatorType, IndicatorDefinition> = {
  SMA: {
    type: 'SMA',
    label: 'Simple Moving Average',
    description: 'The unweighted mean of the closing price over a lookback period.',
    params: [{ key: 'period', label: 'Period', defaultValue: 20, min: 2, max: 500 }],
    outputs: [{ key: 'value', label: 'SMA' }],
  },
  EMA: {
    type: 'EMA',
    label: 'Exponential Moving Average',
    description: 'A moving average that weights recent closes more heavily than older ones.',
    params: [{ key: 'period', label: 'Period', defaultValue: 20, min: 2, max: 500 }],
    outputs: [{ key: 'value', label: 'EMA' }],
  },
  RSI: {
    type: 'RSI',
    label: 'Relative Strength Index',
    description: 'A momentum oscillator (0-100) measuring the speed of recent price changes.',
    params: [{ key: 'period', label: 'Period', defaultValue: 14, min: 2, max: 100 }],
    outputs: [{ key: 'value', label: 'RSI' }],
  },
  MACD: {
    type: 'MACD',
    label: 'MACD',
    description: 'Moving Average Convergence Divergence - trend-following momentum indicator.',
    params: [
      { key: 'fastPeriod', label: 'Fast Period', defaultValue: 12, min: 2, max: 200 },
      { key: 'slowPeriod', label: 'Slow Period', defaultValue: 26, min: 2, max: 400 },
      { key: 'signalPeriod', label: 'Signal Period', defaultValue: 9, min: 2, max: 100 },
    ],
    outputs: [
      { key: 'macdLine', label: 'MACD Line' },
      { key: 'signalLine', label: 'Signal Line' },
      { key: 'histogram', label: 'Histogram' },
    ],
  },
  BOLLINGER_BANDS: {
    type: 'BOLLINGER_BANDS',
    label: 'Bollinger Bands',
    description: 'A moving average with upper/lower bands at N standard deviations.',
    params: [
      { key: 'period', label: 'Period', defaultValue: 20, min: 2, max: 500 },
      { key: 'stdDev', label: 'Std. Deviations', defaultValue: 2, min: 1, max: 5 },
    ],
    outputs: [
      { key: 'upperBand', label: 'Upper Band' },
      { key: 'middleBand', label: 'Middle Band' },
      { key: 'lowerBand', label: 'Lower Band' },
    ],
  },
  ATR: {
    type: 'ATR',
    label: 'Average True Range',
    description: 'A volatility measure - the average of true range over a lookback period.',
    params: [{ key: 'period', label: 'Period', defaultValue: 14, min: 2, max: 100 }],
    outputs: [{ key: 'value', label: 'ATR' }],
  },
};

export const INDICATOR_TYPES = Object.keys(INDICATOR_CATALOG) as IndicatorType[];
