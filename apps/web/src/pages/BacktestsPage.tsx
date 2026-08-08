import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useBacktestsList } from '../features/backtests/useBacktests';
import { Button } from '../components/Button';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

/**
 * The one navigation gap comparison needs filled: until now, a past
 * backtest run was only reachable if you still had its URL from just
 * having created it - there was no way to browse run history at all.
 * Only COMPLETED runs are selectable (checkbox disabled otherwise) since a
 * FAILED/PENDING/RUNNING run has no metrics or trades to compare against.
 */
export function BacktestsPage() {
  const { data: runs, isLoading, isError } = useBacktestsList();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  function toggleSelected(id: string): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleCompare(): void {
    navigate(`/backtests/compare?ids=${Array.from(selectedIds).join(',')}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Backtests</h1>
          <p className="mt-1 text-sm text-slate-400">
            Every backtest you&apos;ve run, across all strategies.
          </p>
        </div>
        <Button disabled={selectedIds.size < 2} onClick={handleCompare}>
          Compare Selected ({selectedIds.size})
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading backtests...</p>}
      {isError && <p className="text-sm text-loss">Couldn&apos;t load your backtests.</p>}

      {runs && runs.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
          <p className="text-sm text-slate-400">You haven&apos;t run any backtests yet.</p>
        </div>
      )}

      {runs && runs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Timeframe</th>
                <th className="px-4 py-3 font-medium">Date Range</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total Return</th>
                <th className="px-4 py-3 font-medium">Run Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {runs.map((run) => (
                <tr key={run.id} className="text-slate-200">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(run.id)}
                      onChange={() => toggleSelected(run.id)}
                      disabled={run.status !== 'COMPLETED'}
                      aria-label={`Select ${run.symbol} backtest for comparison`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/backtests/${run.id}`}
                      className="font-medium text-brand-400 hover:text-brand-300"
                    >
                      {run.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {TIMEFRAME_LABELS[run.timeframe] ?? run.timeframe}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(run.dateFrom).toLocaleDateString()} -{' '}
                    {new Date(run.dateTo).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{STATUS_LABEL[run.status] ?? run.status}</td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      run.totalReturnPct === null
                        ? 'text-slate-500'
                        : run.totalReturnPct >= 0
                          ? 'text-profit'
                          : 'text-loss'
                    }`}
                  >
                    {run.totalReturnPct !== null ? `${run.totalReturnPct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
