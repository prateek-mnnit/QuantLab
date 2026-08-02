import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { fetchBacktest, fetchBacktestTrades } from '../features/backtests/api';
import { ComparisonEquityChart } from '../features/backtests/ComparisonEquityChart';
import { ComparisonMetricsTable } from '../features/backtests/ComparisonMetricsTable';

/**
 * The set of ids being compared is dynamic (2+, chosen on BacktestsPage),
 * so this uses TanStack Query's `useQueries` - the standard tool for "run
 * N queries in parallel where N isn't fixed" - rather than the single-id
 * useBacktest/useBacktestTrades hooks, which are shaped for exactly one id.
 * The underlying fetch functions (fetchBacktest, fetchBacktestTrades) are
 * unchanged and reused directly.
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
      <div className="space-y-3">
        <p className="text-sm text-loss">Select at least two completed backtests to compare.</p>
        <Link to="/backtests" className="text-sm font-medium text-brand-400 hover:text-brand-300">
          Back to Backtests
        </Link>
      </div>
    );
  }

  const isLoading = runQueries.some((query) => query.isLoading) || tradeQueries.some((query) => query.isLoading);
  const isError =
    runQueries.some((query) => query.isError || !query.data) ||
    tradeQueries.some((query) => query.isError || !query.data);

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading comparison...</p>;
  }

  if (isError) {
    return <p className="text-sm text-loss">Couldn&apos;t load one or more backtests for comparison.</p>;
  }

  const runs = runQueries.map((query) => query.data!);
  const tradesByRun = tradeQueries.map((query) => query.data!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Compare Backtests</h1>
        <p className="mt-1 text-sm text-slate-400">{runs.length} backtests, equity indexed to 100.</p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
        <ComparisonEquityChart runs={runs} tradesByRun={tradesByRun} />
      </div>

      <ComparisonMetricsTable runs={runs} />
    </div>
  );
}
