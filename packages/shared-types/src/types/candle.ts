/**
 * Canonical OHLCV shape used everywhere in the system - charts, the market
 * data cache, and (in a later phase) the backtest engine's bar iterator.
 *
 * Every market data provider adapter is responsible for mapping its own
 * vendor-specific response shape into this type before the data leaves the
 * infrastructure layer (see the Historical Market Data Architecture section
 * of the approved design). Nothing outside an adapter should ever see a
 * provider-specific field name.
 */
export interface Candle {
  /** Unix timestamp, in seconds, of the bar's open time (UTC). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W';

/**
 * Human-readable label for every supported timeframe, in a sensible
 * shortest-to-longest display order. Lives here (next to the `Timeframe`
 * type itself) rather than duplicated as a local `Record<string, string>`
 * in each page that renders a timeframe - StrategiesPage, BacktestsPage,
 * BacktestDetailPage, DashboardPage, and ChartPage's own timeframe toggle
 * all import this one map instead of each hand-maintaining their own
 * (previously only '1D'/'1W' were ever added, so the duplication was
 * harmless; a 7-entry union makes that no longer true).
 */
export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '5m': '5 Minutes',
  '15m': '15 Minutes',
  '30m': '30 Minutes',
  '1H': '1 Hour',
  '4H': '4 Hours',
  '1D': 'Daily',
  '1W': 'Weekly',
};

/** Every supported timeframe, in the same shortest-to-longest order as `TIMEFRAME_LABELS` - for building `<select>`/toggle options without repeating the literal list. */
export const TIMEFRAMES: Timeframe[] = ['5m', '15m', '30m', '1H', '4H', '1D', '1W'];

/**
 * Whether a timeframe is intraday (sub-daily). The market data provider
 * only has a limited lookback window for intraday bars (Yahoo Finance
 * caps 5m/15m/30m at ~60 days and 60m-derived bars at ~730 days, vs.
 * effectively unlimited daily/weekly history) - the frontend uses this to
 * show a hint about that limit rather than the user discovering it as an
 * empty chart.
 */
export function isIntradayTimeframe(timeframe: Timeframe): boolean {
  return timeframe !== '1D' && timeframe !== '1W';
}

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
}
