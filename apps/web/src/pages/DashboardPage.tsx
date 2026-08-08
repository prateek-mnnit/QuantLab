import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStrategies } from '../features/strategies/useStrategies';
import { useBacktestsList } from '../features/backtests/useBacktests';
import { useWatchlist } from '../features/watchlist/useWatchlist';
import { useAuthStore } from '../store/authStore';
import { buttonClassName } from '../components/Button';

const TIMEFRAME_LABELS: Record<string, string> = { '1D': 'Daily', '1W': 'Weekly' };
const BACKTEST_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

/** How many rows each "recent" section shows - a dashboard preview, not the full list (that's what "View all" links to). */
const RECENT_ITEM_LIMIT = 5;

/**
 * One of the three summary numbers at the top of the page. Same
 * `rounded-xl border border-surface-border bg-surface-raised p-6` box the
 * Phase-1 placeholder already used for its "Project status" card - no new
 * visual language introduced, just reused for a number instead of a
 * paragraph.
 */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-6">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

/**
 * Shared shell for the three "recent X" sections: a heading with a "View
 * all" link, then loading/error/empty states matching
 * StrategiesPage/BacktestsPage/WatchlistPage's existing copy and classes
 * exactly, or the real content once loaded. Keeping this local to the
 * dashboard (rather than promoting it to `components/`) since nothing else
 * in the app currently needs a "titled list preview with a view-all link"
 * shape - reusing it here just avoids repeating the same six lines of
 * loading/error/empty JSX three times over.
 */
function RecentSection({
  title,
  viewAllHref,
  isLoading,
  isError,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  viewAllHref: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        <Link to={viewAllHref} className="text-sm font-medium text-brand-400 hover:text-brand-300">
          View all
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {isError && <p className="text-sm text-loss">Couldn&apos;t load this section.</p>}
      {isEmpty && (
        <div className="rounded-xl border border-dashed border-surface-border p-6 text-center">
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      )}
      {!isLoading && !isError && !isEmpty && (
        <ul className="divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border">
          {children}
        </ul>
      )}
    </div>
  );
}

/**
 * The real Dashboard, replacing the Phase-1 placeholder above (which just
 * proved the frontend could reach the API). Every number and list here
 * comes from the same three hooks StrategiesPage, BacktestsPage, and
 * WatchlistPage already call - `useStrategies`, `useBacktestsList`, and
 * `useWatchlist` - so mounting this page issues no new endpoint calls
 * beyond what those pages already make, and React Query serves/shares one
 * cached result per query key rather than this page duplicating a fetch.
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: strategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  // No strategyId filter -> every backtest for the current user, the exact
  // same query BacktestsPage runs - same query key, so navigating between
  // the two pages reuses one cached result instead of refetching.
  const { data: backtests, isLoading: backtestsLoading, isError: backtestsError } = useBacktestsList();
  const { data: watchlist, isLoading: watchlistLoading, isError: watchlistError } = useWatchlist();

  const recentStrategies = strategies?.slice(0, RECENT_ITEM_LIMIT) ?? [];
  const recentBacktests = backtests?.slice(0, RECENT_ITEM_LIMIT) ?? [];
  const watchlistPreview = watchlist?.slice(0, RECENT_ITEM_LIMIT) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">
          Welcome back{user ? `, ${user.email}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s where your strategies, backtests, and watchlist stand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Strategies" value={strategies?.length ?? 0} />
        <StatCard label="Total Backtests" value={backtests?.length ?? 0} />
        <StatCard label="Watchlist" value={watchlist?.length ?? 0} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <RecentSection
          title="Recent Strategies"
          viewAllHref="/strategies"
          isLoading={strategiesLoading}
          isError={strategiesError}
          isEmpty={Boolean(strategies) && strategies!.length === 0}
          emptyMessage="You haven't created any strategies yet."
        >
          {recentStrategies.map((strategy) => (
            <li key={strategy.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link
                  to={`/strategies/${strategy.id}/edit`}
                  className="font-medium text-slate-100 hover:text-brand-300"
                >
                  {strategy.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {TIMEFRAME_LABELS[strategy.timeframe] ?? strategy.timeframe} · v{strategy.version}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(strategy.updatedAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </RecentSection>

        <RecentSection
          title="Recent Backtests"
          viewAllHref="/backtests"
          isLoading={backtestsLoading}
          isError={backtestsError}
          isEmpty={Boolean(backtests) && backtests!.length === 0}
          emptyMessage="You haven't run any backtests yet."
        >
          {recentBacktests.map((run) => (
            <li key={run.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link to={`/backtests/${run.id}`} className="font-medium text-slate-100 hover:text-brand-300">
                  {run.symbol}
                </Link>
                <p className="text-xs text-slate-500">
                  {TIMEFRAME_LABELS[run.timeframe] ?? run.timeframe} ·{' '}
                  {BACKTEST_STATUS_LABEL[run.status] ?? run.status}
                </p>
              </div>
              <span
                className={`text-sm font-medium ${
                  run.totalReturnPct === null
                    ? 'text-slate-500'
                    : run.totalReturnPct >= 0
                      ? 'text-profit'
                      : 'text-loss'
                }`}
              >
                {run.totalReturnPct !== null ? `${run.totalReturnPct.toFixed(2)}%` : '—'}
              </span>
            </li>
          ))}
        </RecentSection>
      </div>

      <RecentSection
        title="Watchlist"
        viewAllHref="/watchlist"
        isLoading={watchlistLoading}
        isError={watchlistError}
        isEmpty={Boolean(watchlist) && watchlist!.length === 0}
        emptyMessage="Your watchlist is empty."
      >
        {watchlistPreview.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3">
            <p className="font-medium text-slate-100">{item.symbol}</p>
            <span className="text-xs text-slate-500">
              Added {new Date(item.addedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </RecentSection>

      {strategies && strategies.length === 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-6 text-center">
          <p className="text-sm text-slate-400">Get started by building your first strategy.</p>
          <Link to="/strategies/new" className={`${buttonClassName} mt-3`}>
            New Strategy
          </Link>
        </div>
      )}
    </div>
  );
}
