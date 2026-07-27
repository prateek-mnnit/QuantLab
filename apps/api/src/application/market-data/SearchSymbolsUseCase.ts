import type { SymbolResult } from '@quantlab/shared-types';
import type { MarketDataProvider } from '../../infrastructure/market-data/MarketDataProvider.js';

export class SearchSymbolsUseCase {
  constructor(private readonly marketDataProvider: MarketDataProvider) {}

  execute(query: string): Promise<SymbolResult[]> {
    return this.marketDataProvider.searchSymbols(query);
  }
}
