import { useMemo } from 'react';
import type { Timeframe } from '@quantlab/shared-types';
import { TIMEFRAME_LABELS, TIMEFRAMES, isIntradayTimeframe } from '@quantlab/shared-types';
import { useCandles, useSymbolSearch } from '../features/market-data/useMarketData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useChartViewStore } from '../store/chartViewStore';
import { CandlestickChart } from '../components/CandlestickChart';

const DAYS_OF_HISTORY: Record<Timeframe, number> = {
  '5m': 30, '15m': 30, '30m': 45,
  '1H': 180, '4H': 365, '1D': 365, '1W': 365 * 3,
};

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = TIMEFRAMES.map((value) => ({
  value,
  label: TIMEFRAME_LABELS[value],
}));

const SEARCH_DEBOUNCE_MS = 300;

function formatChange(change: number, changePct: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePct.toFixed(2)}%)`;
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-zinc-800/60"
      style={{ height }}
      aria-label="Loading chart"
    />
  );
}

export function ChartPage() {
  const query          = useChartViewStore((s) => s.query);
  const selectedSymbol = useChartViewStore((s) => s.selectedSymbol);
  const timeframe      = useChartViewStore((s) => s.timeframe);
  const setQuery       = useChartViewStore((s) => s.setQuery);
  const selectSymbol   = useChartViewStore((s) => s.selectSymbol);
  const setTimeframe   = useChartViewStore((s) => s.setTimeframe);
  const clearSelection = useChartViewStore((s) => s.clearSelection);

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { data: searchResults, isFetching: isSearching } = useSymbolSearch(debouncedQuery);

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

  const showResults = query.length > 0 && !query.startsWith(selectedSymbol?.symbol ?? '\0');

  const latestChange = useMemo(() => {
    if (!candles || candles.length < 2) return null;
    const latest   = candles[candles.length - 1]!;
    const previous = candles[candles.length - 2]!;
    const change   = latest.close - previous.close;
    const changePct = (change / previous.close) * 100;
    return { latestClose: latest.close, change, changePct };
  }, [candles]);

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Charts</h1>
        <p className="mt-1 text-sm text-zinc-500">Historical price data.</p>
      </div>

      {/* ── Toolbar: search + timeframe ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Symbol search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="h-4 w-4 text-zinc-500" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search symbol (e.g. AAPL)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600/30 transition-colors"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear symbol search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Dropdown */}
          {showResults && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-dropdown">
              {isSearching && (
                <div className="px-3 py-2.5 text-sm text-zinc-500">Searching…</div>
              )}
              {!isSearching && searchResults?.length === 0 && (
                <div className="px-3 py-2.5 text-sm text-zinc-500">No matches found.</div>
              )}
              {searchResults?.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => selectSymbol(result)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-800"
                >
                  <span className="font-medium text-zinc-100">{result.symbol}</span>
                  <span className="truncate text-zinc-500">{result.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeframe segmented control */}
        <div
          role="group"
          aria-label="Chart timeframe"
          className="inline-flex flex-wrap rounded-md border border-zinc-800 bg-zinc-900 p-0.5"
        >
          {TIMEFRAME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeframe(option.value)}
              aria-pressed={timeframe === option.value}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${
                timeframe === option.value
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Intraday notice */}
        {isIntradayTimeframe(timeframe) && (
          <span className="text-xs text-zinc-600">
            History limited to ~{DAYS_OF_HISTORY[timeframe]}d for this timeframe.
          </span>
        )}
      </div>

      {/* ── Symbol info bar ─────────────────────────────────────────────── */}
      {selectedSymbol && (
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">{selectedSymbol.symbol}</h2>
          <span className="text-sm text-zinc-500">{selectedSymbol.name}</span>
          {latestChange && (
            <span className="flex items-baseline gap-2 text-sm">
              <span className="font-semibold tabular-nums text-zinc-100">
                {latestChange.latestClose.toFixed(2)}
              </span>
              <span className={`tabular-nums font-medium ${latestChange.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatChange(latestChange.change, latestChange.changePct)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* ── Chart container ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        {!selectedSymbol && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 h-10 w-10 text-zinc-700" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <p className="text-sm text-zinc-500">Search for a symbol to view its chart.</p>
            </div>
          </div>
        )}
        {selectedSymbol && isLoadingCandles && <ChartSkeleton height={420} />}
        {selectedSymbol && isError && (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-sm text-red-400">
              Couldn&apos;t load chart data for {selectedSymbol.symbol}.
            </p>
            <button
              type="button"
              onClick={() => void refetchCandles()}
              className="mt-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {selectedSymbol && candles && candles.length > 0 && (
          <CandlestickChart candles={candles} />
        )}
        {selectedSymbol && candles && candles.length === 0 && !isLoadingCandles && (
          <p className="py-24 text-center text-sm text-zinc-500">No data available for this range.</p>
        )}
      </div>
    </div>
  );
}
