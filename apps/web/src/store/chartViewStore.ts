import { create } from 'zustand';
import type { SymbolResult, Timeframe } from '@quantlab/shared-types';

/**
 * Group AH, section 5: a first-time visitor's Charts page should never
 * open blank. RELIANCE.NS is already part of the seeded demo watchlist
 * (see `apps/api/src/scripts/seedDemoData.ts`), so this keeps the default
 * consistent with the rest of the demo experience instead of picking an
 * unrelated symbol. This is ONLY the store's initial value - the instant
 * the user searches or selects anything else, `selectSymbol`/`setQuery`
 * below replace it exactly as before, and nothing here ever resets an
 * existing selection back to this default.
 */
const DEFAULT_SYMBOL: SymbolResult = {
  symbol: 'RELIANCE.NS',
  name: 'Reliance Industries Ltd.',
  exchange: 'NSE',
};

interface ChartViewState {
  query: string;
  selectedSymbol: SymbolResult | null;
  timeframe: Timeframe;
  /** The user is typing - updates the search box text and, since whatever was previously selected no longer matches it, clears the current selection. */
  setQuery: (query: string) => void;
  selectSymbol: (symbol: SymbolResult) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  /** Back to an empty search box with nothing selected - used by the search box's clear (x) button. */
  clearSelection: () => void;
}

/**
 * Lives outside the `ChartPage` component tree (the same reason
 * `strategyDraftStore` exists) specifically so its state outlives
 * `ChartPage` unmounting when the user navigates to another page -
 * `useState` inside `ChartPage` itself would reset to blank on every
 * remount, which is exactly the "did my chart forget what I was looking
 * at" problem this store exists to avoid.
 */
export const useChartViewStore = create<ChartViewState>((set) => ({
  query: `${DEFAULT_SYMBOL.symbol} - ${DEFAULT_SYMBOL.name}`,
  selectedSymbol: DEFAULT_SYMBOL,
  timeframe: '1D',

  setQuery: (query) => set({ query, selectedSymbol: null }),

  // Also fills the search box with the selection's label, matching what
  // ChartPage's own click handler already did before this store existed -
  // keeps "what's in the box" and "what's selected" consistent in one
  // place instead of two call sites doing it separately.
  selectSymbol: (symbol) => set({ selectedSymbol: symbol, query: `${symbol.symbol} - ${symbol.name}` }),

  setTimeframe: (timeframe) => set({ timeframe }),

  clearSelection: () => set({ query: '', selectedSymbol: null }),
}));
