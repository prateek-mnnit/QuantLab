import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { fetchBacktest, fetchBacktestTrades } from '../features/backtests/api';
import { ComparisonEquityChart } from '../features/backtests/ComparisonEquityChart';
import { ComparisonMetricsTable } from '../features/backtests/ComparisonMetricsTable';

/**
 * Side-by-side comparison of 2+ completed backtests.
 * Uses TanStack Query's `useQueries` for parallel fetching of N runs.
 * The underlying fetch functions (fetchBacktest, fetchBacktestTrades) are
 * unchanged and reused directly — only the presentation layer is updated.
 */
export function BacktestComparePage() {
  const [searchParams] = useSearchParams();

  const ids = useMemo(
    () =>
      (searchParams.get('ids') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    [searchParams],
  );

  const runQueries = useQueries({
    queries: ids.map((id) => ({ queryKey: ['backtests', id], queryFn: () => fetchBacktest(id) })),
  });
  const tradeQueries = useQueries({
    queries: ids.map((id) => ({ queryKey: ['backtests', id, 'trades'], queryFn: () => fetchBacktestTrades(id) })),
  });

  if (ids.length < 2) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400">Select at least two completed backtests to compare.</p>
        <Link to="/backtests" className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
          ← Back to Backtests
        </Link>
      </div>
    );
  }

  const isLoading =
    runQueries.some((q) => q.isLoading) || tradeQueries.some((q) => q.isLoading);
  const isError =
    runQueries.some((q) => q.isError || !q.data) ||
    tradeQueries.some((q) => q.isError || !q.data);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 rounded bg-zinc-800" />
        <div className="h-64 rounded-lg bg-zinc-800" />
        <div className="h-40 rounded-lg bg-zinc-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        Couldn&apos;t load one or more backtests for comparison.
      </p>
    );
  }

  const runs        = runQueries.map((q) => q.data!);
  const tradesByRun = tradeQueries.map((q) => q.data!);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Compare Backtests</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {runs.length} backtests — equity indexed to 100 for relative comparison.
          </p>
        </div>
        <Link
          to="/backtests"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← All Backtests
        </Link>
      </div>

      {/* Equity curve panel */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Equity Comparison
        </p>
        <ComparisonEquityChart runs={runs} tradesByRun={tradesByRun} />
      </div>

      {/* Metrics table */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Metrics Comparison
        </p>
        <ComparisonMetricsTable runs={runs} />
      </div>
    </div>
  );
}
