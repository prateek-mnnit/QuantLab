import { useMemo, useState } from 'react';
import type { SymbolResult, Timeframe } from '@quantlab/shared-types';
import { useCandles, useSymbolSearch } from '../features/market-data/useMarketData';
import { CandlestickChart } from '../components/CandlestickChart';

// How far back to load by default for each timeframe - weekly bars are
// coarser, so a useful weekly chart needs a longer window than a daily one.
const DAYS_OF_HISTORY: Record<Timeframe, number> = { '1D': 365, '1W': 365 * 3 };

export function ChartPage() {
  const [query, setQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolResult | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');

  const { data: searchResults, isFetching: isSearching } = useSymbolSearch(query);

  // Recomputed only when `timeframe` changes, not on every render - a new
  // `Date` object every render would otherwise change the query key on
  // useCandles below and cause a refetch loop.
  const { from, to } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - DAYS_OF_HISTORY[timeframe]);
    return { from, to };
  }, [timeframe]);

  const {
    data: candles,
    isLoading: isLoadingCandles,
    isError,
  } = useCandles(selectedSymbol?.symbol ?? null, timeframe, from, to);

  // A result is already selected once its symbol appears verbatim at the
  // start of the search box - this is what hides the results dropdown
  // right after a user clicks a result, without needing a separate
  // "dropdown open" boolean to keep in sync.
  const showResults = query.length > 0 && !query.startsWith(selectedSymbol?.symbol ?? '\0');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Charts</h1>
        <p className="mt-1 text-sm text-slate-400">Historical price data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search symbol (e.g. AAPL)"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedSymbol(null);
            }}
            className="w-64 rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {showResults && (
            <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-surface-border bg-surface-raised shadow-lg">
              {isSearching && <div className="px-3 py-2 text-sm text-slate-500">Searching...</div>}
              {!isSearching && searchResults?.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500">No matches.</div>
              )}
              {searchResults?.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => {
                    setSelectedSymbol(result);
                    setQuery(`${result.symbol} - ${result.name}`);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-surface"
                >
                  <span className="font-medium">{result.symbol}</span>{' '}
                  <span className="text-slate-500">{result.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={timeframe}
          onChange={(event) => setTimeframe(event.target.value as Timeframe)}
          className="rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="1D">Daily</option>
          <option value="1W">Weekly</option>
        </select>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
        {!selectedSymbol && (
          <p className="py-20 text-center text-sm text-slate-500">
            Search for a symbol to view its chart.
          </p>
        )}
        {selectedSymbol && isLoadingCandles && (
          <p className="py-20 text-center text-sm text-slate-500">Loading chart...</p>
        )}
        {selectedSymbol && isError && (
          <p className="py-20 text-center text-sm text-loss">
            Couldn&apos;t load chart data for {selectedSymbol.symbol}.
          </p>
        )}
        {selectedSymbol && candles && candles.length > 0 && <CandlestickChart candles={candles} />}
        {selectedSymbol && candles && candles.length === 0 && !isLoadingCandles && (
          <p className="py-20 text-center text-sm text-slate-500">No data available for this range.</p>
        )}
      </div>
    </div>
  );
}
