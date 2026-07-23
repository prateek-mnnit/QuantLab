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

export type Timeframe = '1D' | '1W';

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
}
