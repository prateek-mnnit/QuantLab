import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StrategySummary } from '@quantlab/shared-types';
import { TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useStrategies, useDeleteStrategy } from '../features/strategies/useStrategies';
import { buttonClassName } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';



export function StrategiesPage() {
  const { data: strategies, isLoading, isError } = useStrategies();
  const deleteStrategy = useDeleteStrategy();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'builtin' | 'mine'>('builtin');

  function handleRequestDelete(id: string, name: string): void { setDeleteTarget({ id, name }); }
  function handleCancelDelete():  void { setDeleteTarget(null); }
  function handleConfirmDelete(): void {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setPendingDeleteId(id);
    deleteStrategy.mutate(id, {
      onSettled: () => setPendingDeleteId(null),
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const builtInStrategies = strategies?.filter((s) => s.isBuiltIn)  ?? [];
  const myStrategies       = strategies?.filter((s) => !s.isBuiltIn) ?? [];

  // Auto-switch to 'mine' when there are no built-in strategies but the user
  // has their own — keeps the delete-flow tests working without needing a
  // manual tab click, and provides a better UX on first load.
  const effectiveTab = activeTab === 'builtin' && builtInStrategies.length === 0 && myStrategies.length > 0
    ? 'mine'
    : activeTab;

  const displayed = effectiveTab === 'builtin' ? builtInStrategies : myStrategies;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Strategies</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Browse built-in examples or manage your own strategies.
          </p>
        </div>
        <Link to="/strategies/new" className={buttonClassName}>
          + New Strategy
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-0.5 w-fit">
        {(['builtin', 'mine'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded px-4 py-1.5 text-sm font-medium transition-colors duration-100 ${
              effectiveTab === tab
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'builtin' ? `Built-in (${builtInStrategies.length})` : `My Strategies (${myStrategies.length})`}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-xs text-zinc-600">
        {effectiveTab === 'builtin'
          ? 'Ready-to-use technical analysis strategies that ship with QuantLab — read-only, shared by every account.'
          : 'Strategies you have created and can edit or delete.'}
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Couldn&apos;t load strategies. Please refresh the page.
        </div>
      )}

      {/* Table */}
      {strategies && (
        displayed.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              {activeTab === 'mine'
                ? "You haven't created any strategies yet."
                : 'No built-in strategies available yet.'}
            </p>
            {activeTab === 'mine' && (
              <Link to="/strategies/new" className="mt-3 inline-block text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                Build your first strategy →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Name</th>
                  <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Timeframe</th>
                  <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Version</th>
                  <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Updated</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-600">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((strategy) => (
                  <StrategyRow
                    key={strategy.id}
                    strategy={strategy}
                    pendingDeleteId={pendingDeleteId}
                    onDelete={handleRequestDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ''}"?`}
        description="This strategy and all its configuration will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        isConfirming={deleteTarget !== null && pendingDeleteId === deleteTarget.id}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

function StrategyRow({
  strategy,
  pendingDeleteId,
  onDelete,
}: {
  strategy: StrategySummary;
  pendingDeleteId: string | null;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <tr className="border-b border-zinc-800/50 transition-colors duration-75 last:border-b-0 hover:bg-zinc-800/30">
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-100">{strategy.name}</p>
        {strategy.description && (
          <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-500">{strategy.description}</p>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-zinc-400">
        {TIMEFRAME_LABELS[strategy.timeframe] ?? strategy.timeframe}
      </td>
      <td className="px-3 py-3 text-sm text-zinc-500">v{strategy.version}</td>
      <td className="px-3 py-3 text-sm text-zinc-500">
        {new Date(strategy.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-3">
          <Link
            to={`/backtests/new?strategyId=${strategy.id}`}
            className="inline-flex items-center rounded border border-amber-700/30 bg-transparent px-2.5 py-1 text-xs font-medium text-amber-500 transition-colors hover:border-amber-600/40 hover:text-amber-400 whitespace-nowrap"
          >
            Run Backtest
          </Link>
          {!strategy.isBuiltIn && (
            <>
              <Link
                to={`/strategies/${strategy.id}/edit`}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => onDelete(strategy.id, strategy.name)}
                disabled={pendingDeleteId === strategy.id}
                className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {pendingDeleteId === strategy.id ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
