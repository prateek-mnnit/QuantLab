import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StrategySummary } from '@quantlab/shared-types';
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

  // Group AH: built-in strategies are PRODUCT-LEVEL content - they ship
  // with QuantLab itself (see apps/api/src/scripts/seedPrebuiltContent.ts)
  // and are visible to every authenticated user via the same GET
  // /strategies request `useStrategies` already made (ListStrategiesUseCase
  // now returns "this user's own strategies UNION every built-in one" -
  // see StrategyRepository.findManyVisibleToUser), not a second request or
  // a demo account. They get their own section ABOVE the user's own
  // strategies, so a recruiter (or any new user) opening this page sees
  // what QuantLab can do immediately, without first clicking through "New
  // Strategy" to discover the template picker.
  const builtInStrategies = strategies?.filter((strategy) => strategy.isBuiltIn) ?? [];
  const myStrategies = strategies?.filter((strategy) => !strategy.isBuiltIn) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Strategies</h1>
          <p className="mt-1 text-sm text-slate-400">
            Built-in examples to explore, and the strategies you&apos;ve built yourself.
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

      {strategies && (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Built-in Strategies</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Ready-to-use, recognizable technical-analysis strategies that ship with QuantLab - open one to see
                real entry/exit conditions, or run a backtest. They&apos;re read-only and shared by every account.
              </p>
            </div>
            {builtInStrategies.length > 0 ? (
              <StrategyTable strategies={builtInStrategies} pendingDeleteId={pendingDeleteId} onDelete={handleDelete} />
            ) : (
              <div className="rounded-xl border border-dashed border-surface-border p-6 text-center">
                <p className="text-sm text-slate-400">No built-in strategies available yet.</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">My Strategies</h2>
            {myStrategies.length > 0 ? (
              <StrategyTable strategies={myStrategies} pendingDeleteId={pendingDeleteId} onDelete={handleDelete} />
            ) : (
              <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
                <p className="text-sm text-slate-400">
                  You haven&apos;t created any strategies yet - start from a built-in strategy above, or build your
                  own.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StrategyTable({
  strategies,
  pendingDeleteId,
  onDelete,
}: {
  strategies: StrategySummary[];
  pendingDeleteId: string | null;
  onDelete: (id: string, name: string) => void;
}) {
  return (
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
                {strategy.description && <div className="mt-0.5 text-xs text-slate-500">{strategy.description}</div>}
              </td>
              <td className="px-4 py-3 text-slate-400">{TIMEFRAME_LABELS[strategy.timeframe] ?? strategy.timeframe}</td>
              <td className="px-4 py-3 text-slate-400">v{strategy.version}</td>
              <td className="px-4 py-3 text-slate-400">{new Date(strategy.updatedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/backtests/new?strategyId=${strategy.id}`}
                  className="mr-4 text-sm font-medium text-brand-400 hover:text-brand-300"
                >
                  Run Backtest
                </Link>
                {/* Built-in strategies have no Edit/Delete here - the API
                    itself already refuses to mutate or delete them
                    (StrategyRepository.findByIdForUser is strictly
                    own-only, so a built-in row can never match), this just
                    keeps the UI from offering an action that would only
                    ever come back as an error. */}
                {!strategy.isBuiltIn && (
                  <>
                    <Link
                      to={`/strategies/${strategy.id}/edit`}
                      className="mr-4 text-sm font-medium text-brand-400 hover:text-brand-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => onDelete(strategy.id, strategy.name)}
                      disabled={pendingDeleteId === strategy.id}
                      className="text-sm font-medium text-loss hover:text-loss/80 disabled:opacity-50"
                    >
                      {pendingDeleteId === strategy.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
