import { create } from 'zustand';
import type { SymbolResult, Timeframe } from '@quantlab/shared-types';

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
  query: '',
  selectedSymbol: null,
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
