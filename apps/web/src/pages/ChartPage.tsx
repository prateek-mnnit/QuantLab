import { useMemo } from 'react';
import type { Timeframe } from '@quantlab/shared-types';
import { useCandles, useSymbolSearch } from '../features/market-data/useMarketData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useChartViewStore } from '../store/chartViewStore';
import { CandlestickChart } from '../components/CandlestickChart';

// How far back to load by default for each timeframe - weekly bars are
// coarser, so a useful weekly chart needs a longer window than a daily one.
//
// Note on scope: intraday timeframes (5m/15m/1h) were considered for this
// group but aren't supported by the current architecture without changes
// well outside it - `Timeframe` (shared-types/types/candle.ts) is a
// foundational `'1D' | '1W'` union baked into strategyInputSchema, the
// strategy model, and YahooFinanceProvider's own
// `Record<Timeframe, string>` interval map. Widening it would ripple into
// strategy creation and the backtest engine, both explicitly off-limits
// for this group - so this group sticks to what the existing two
// timeframes and existing candle data can support.
const DAYS_OF_HISTORY: Record<Timeframe, number> = { '1D': 365, '1W': 365 * 3 };

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '1D', label: 'Daily' },
  { value: '1W', label: 'Weekly' },
];

/** How long to wait after the user stops typing before firing a search request. */
const SEARCH_DEBOUNCE_MS = 300;

function formatChange(change: number, changePct: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
}

/**
 * A skeleton placeholder shaped like the real chart, shown while candles
 * are loading - replaces the old plain "Loading chart..." text with
 * something that doesn't make the page jump once real content arrives, and
 * reads as "something is happening" rather than a blank pause.
 */
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-surface"
      style={{ height }}
      aria-label="Loading chart"
    />
  );
}

export function ChartPage() {
  const query = useChartViewStore((state) => state.query);
  const selectedSymbol = useChartViewStore((state) => state.selectedSymbol);
  const timeframe = useChartViewStore((state) => state.timeframe);
  const setQuery = useChartViewStore((state) => state.setQuery);
  const selectSymbol = useChartViewStore((state) => state.selectSymbol);
  const setTimeframe = useChartViewStore((state) => state.setTimeframe);
  const clearSelection = useChartViewStore((state) => state.clearSelection);

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { data: searchResults, isFetching: isSearching } = useSymbolSearch(debouncedQuery);

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
    refetch: refetchCandles,
  } = useCandles(selectedSymbol?.symbol ?? null, timeframe, from, to);

  // A result is already selected once its symbol appears verbatim at the
  // start of the search box - this is what hides the results dropdown
  // right after a user clicks a result, without needing a separate
  // "dropdown open" boolean to keep in sync.
  const showResults = query.length > 0 && !query.startsWith(selectedSymbol?.symbol ?? '\0');

  // Derived entirely from candles the chart already fetched - no new
  // endpoint, no new query. `null` until there are at least two candles to
  // compare (a brand-new symbol with exactly one bar has a price but no
  // "change" to report yet).
  const latestChange = useMemo(() => {
    if (!candles || candles.length < 2) return null;
    const latest = candles[candles.length - 1]!;
    const previous = candles[candles.length - 2]!;
    const change = latest.close - previous.close;
    const changePct = (change / previous.close) * 100;
    return { latestClose: latest.close, change, changePct };
  }, [candles]);

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
            onChange={(event) => setQuery(event.target.value)}
            className="w-64 rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 pr-8 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear symbol search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          )}
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
                  onClick={() => selectSymbol(result)}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-surface"
                >
                  <span className="font-medium">{result.symbol}</span>{' '}
                  <span className="text-slate-500">{result.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* A two-way segmented toggle reads faster than a dropdown for a
            binary choice - no extra click to open a menu, and both options
            are visible (and their current state obvious) at all times. */}
        <div
          role="group"
          aria-label="Chart timeframe"
          className="inline-flex rounded-lg border border-surface-border bg-surface p-1"
        >
          {TIMEFRAME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeframe(option.value)}
              aria-pressed={timeframe === option.value}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeframe === option.value
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {selectedSymbol && (
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold text-slate-100">{selectedSymbol.symbol}</h2>
          <span className="text-sm text-slate-500">{selectedSymbol.name}</span>
          {latestChange && (
            <span className="flex items-baseline gap-2 text-sm">
              <span className="font-medium text-slate-100">{latestChange.latestClose.toFixed(2)}</span>
              <span className={latestChange.change >= 0 ? 'text-profit' : 'text-loss'}>
                {formatChange(latestChange.change, latestChange.changePct)}
              </span>
            </span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
        {!selectedSymbol && (
          <p className="py-20 text-center text-sm text-slate-500">
            Search for a symbol to view its chart.
          </p>
        )}
        {selectedSymbol && isLoadingCandles && <ChartSkeleton height={420} />}
        {selectedSymbol && isError && (
          <div className="py-20 text-center">
            <p className="text-sm text-loss">Couldn&apos;t load chart data for {selectedSymbol.symbol}.</p>
            <button
              type="button"
              onClick={() => void refetchCandles()}
              className="mt-3 text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              Retry
            </button>
          </div>
        )}
        {selectedSymbol && candles && candles.length > 0 && <CandlestickChart candles={candles} />}
        {selectedSymbol && candles && candles.length === 0 && !isLoadingCandles && (
          <p className="py-20 text-center text-sm text-slate-500">No data available for this range.</p>
        )}
      </div>
    </div>
  );
}
