import type { Candle, SymbolResult, Timeframe } from '@quantlab/shared-types';

/**
 * The port every market data consumer depends on - controllers today, and
 * the backtest engine's bar-iterator data loader in a later phase. Nothing
 * outside this file and its concrete implementations (e.g.
 * YahooFinanceProvider) is allowed to know which vendor is behind it.
 * Adding a second provider later means writing one new class that
 * implements this interface and swapping it in container.ts - zero changes
 * to controllers, use cases, or (eventually) the backtest engine. This is
 * the concrete payoff of the "provider abstraction" the approved
 * architecture called for.
 */
export interface MarketDataProvider {
  getCandles(symbol: string, timeframe: Timeframe, from: Date, to: Date): Promise<Candle[]>;
  searchSymbols(query: string): Promise<SymbolResult[]>;
}
