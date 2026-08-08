import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useStrategies, useDeleteStrategy } from '../features/strategies/useStrategies';
import { buttonClassName } from '../components/Button';

export function StrategiesPage() {
  const { data: strategies, isLoading, isError } = useStrategies();
  const deleteStrategy = useDeleteStrategy();
  // Tracks which row's delete is in flight so only THAT row's button shows
  // a loading state, rather than every row disabling at once.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleDelete(id: string, name: string): void {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setPendingDeleteId(id);
    deleteStrategy.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Strategies</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your saved trading strategies.
          </p>
        </div>
        {/* The visual builder now exists (StrategyBuilderPage) - this
            navigates to /strategies/new via a real <Link>, styled to look
            identical to the shared Button component. */}
        <Link to="/strategies/new" className={buttonClassName}>
          New Strategy
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading strategies...</p>}

      {isError && (
        <div className="rounded-lg border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
          Couldn&apos;t load your strategies. Please try refreshing the page.
        </div>
      )}

      {strategies && strategies.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
          <p className="text-sm text-slate-400">
            You haven&apos;t created any strategies yet.
          </p>
        </div>
      )}

      {strategies && strategies.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Timeframe</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Last updated</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {strategies.map((strategy) => (
                <tr key={strategy.id} className="text-slate-200">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{strategy.name}</div>
                    {strategy.description && (
                      <div className="mt-0.5 text-xs text-slate-500">{strategy.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {TIMEFRAME_LABELS[strategy.timeframe] ?? strategy.timeframe}
                  </td>
                  <td className="px-4 py-3 text-slate-400">v{strategy.version}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(strategy.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/strategies/${strategy.id}/edit`}
                      className="mr-4 text-sm font-medium text-brand-400 hover:text-brand-300"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/backtests/new?strategyId=${strategy.id}`}
                      className="mr-4 text-sm font-medium text-brand-400 hover:text-brand-300"
                    >
                      Run Backtest
                    </Link>
                    <button
                      onClick={() => handleDelete(strategy.id, strategy.name)}
                      disabled={pendingDeleteId === strategy.id}
                      className="text-sm font-medium text-loss hover:text-loss/80 disabled:opacity-50"
                    >
                      {pendingDeleteId === strategy.id ? 'Deleting...' : 'Delete'}
                    </button>
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
