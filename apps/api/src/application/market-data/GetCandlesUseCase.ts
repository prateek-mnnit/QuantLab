import type { Candle, Timeframe } from '@quantlab/shared-types';
import type { MarketDataProvider } from '../../infrastructure/market-data/MarketDataProvider.js';

/**
 * A thin pass-through today - it doesn't yet add business logic beyond
 * delegating to the port. That's intentional, not a placeholder: this is
 * the exact seam the backtest engine's data loader will also depend on in
 * the next phase (same `MarketDataProvider` port, same use-case pattern),
 * so establishing it now - rather than having the controller call the
 * provider directly - keeps that future addition a non-breaking change
 * instead of a refactor.
 */
export class GetCandlesUseCase {
  constructor(private readonly marketDataProvider: MarketDataProvider) {}

  execute(symbol: string, timeframe: Timeframe, from: Date, to: Date): Promise<Candle[]> {
    return this.marketDataProvider.getCandles(symbol, timeframe, from, to);
  }
}
