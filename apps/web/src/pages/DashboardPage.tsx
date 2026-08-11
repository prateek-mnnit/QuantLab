import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useStrategies } from '../features/strategies/useStrategies';
import { useBacktestsList } from '../features/backtests/useBacktests';
import { useWatchlist } from '../features/watchlist/useWatchlist';
import { useAuthStore } from '../store/authStore';
import { useChartViewStore } from '../store/chartViewStore';
import { MarketOverview } from '../features/dashboard/MarketOverview';
import { buildRecentActivity, formatRelativeTime } from '../features/dashboard/recentActivity';

const BACKTEST_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

/** How many rows each "recent" section shows - a dashboard preview, not the full list (that's what "View all" links to). */
const RECENT_ITEM_LIMIT = 5;

/**
 * Group AJ: the three summary numbers at the top of the page are now
 * navigable - same `rounded-xl border border-surface-border
 * bg-surface-raised p-6` box as before, rendered as a `<Link>` instead of
 * a `<div>` so it's a real, keyboard-accessible navigation target, with a
 * subtle border/background shift on hover as the only added affordance
 * (no scale, shadow, or color-flip - "subtle", not flashy, per spec).
 */
function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-surface-border bg-surface-raised p-6 transition-colors hover:border-brand-500/40 hover:bg-surface"
    >
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
    </Link>
  );
}

/**
 * Four compact entry points into flows that already exist elsewhere in the
 * app - every one of these is a plain `<Link>` to an existing route
 * (`/strategies/new`, `/backtests/new`, `/chart`, `/watchlist`), not a new
 * page, modal, or endpoint. Styled as small bordered chips rather than
 * full `Button`-style CTAs, matching "compact" over "flashy".
 */
function QuickActions() {
  const actions: { label: string; to: string }[] = [
    { label: '+ New Strategy', to: '/strategies/new' },
    { label: 'Run Backtest', to: '/backtests/new' },
    { label: 'View Charts', to: '/chart' },
    { label: 'Add to Watchlist', to: '/watchlist' },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="rounded-lg border border-surface-border bg-surface-raised px-4 py-3 text-center text-sm font-medium text-slate-200 transition-colors hover:border-brand-500/40 hover:bg-surface"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Shared shell for the "recent X" list sections: a heading with a "View
 * all" link, then loading/error/empty states matching
 * StrategiesPage/BacktestsPage/WatchlistPage's existing copy and classes
 * exactly, or the real content once loaded. Keeping this local to the
 * dashboard (rather than promoting it to `components/`) since nothing else
 * in the app currently needs a "titled list preview with a view-all link"
 * shape - reusing it here just avoids repeating the same six lines of
 * loading/error/empty JSX for every section.
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
 * The real Dashboard. Every number and list here comes from the same three
 * hooks StrategiesPage, BacktestsPage, and WatchlistPage already call -
 * `useStrategies`, `useBacktestsList`, and `useWatchlist` - so mounting
 * this page issues no new endpoint calls beyond what those pages already
 * make (React Query serves/shares one cached result per query key), plus
 * the same `useCandles` hook ChartPage uses for the Market Overview strip.
 *
 * Group AJ's page order - Stats, Quick Actions, Market Overview, Recent
 * Backtests, Recent Activity, Watchlist - replaces the previous "Recent
 * Strategies" section with "Recent Activity": a cross-cutting feed
 * (strategy/backtest/watchlist events together) is more useful on a
 * landing page than a single-category list, and "Created strategy" events
 * are already one of Recent Activity's three event types, so nothing is
 * lost.
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const selectChartSymbol = useChartViewStore((state) => state.selectSymbol);

  const { data: strategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  // No strategyId filter -> every backtest visible to the current user,
  // the exact same query BacktestsPage runs - same query key, so
  // navigating between the two pages reuses one cached result instead of
  // refetching.
  const { data: backtests, isLoading: backtestsLoading, isError: backtestsError } = useBacktestsList();
  const { data: watchlist, isLoading: watchlistLoading, isError: watchlistError } = useWatchlist();

  const strategyNameById = new Map((strategies ?? []).map((strategy) => [strategy.id, strategy.name]));
  const recentBacktests = backtests?.slice(0, RECENT_ITEM_LIMIT) ?? [];
  const watchlistPreview = watchlist?.slice(0, RECENT_ITEM_LIMIT) ?? [];

  const recentActivity =
    strategies && backtests && watchlist ? buildRecentActivity(strategies, backtests, watchlist, RECENT_ITEM_LIMIT) : [];
  const activityLoading = strategiesLoading || backtestsLoading || watchlistLoading;
  const activityError = strategiesError || backtestsError || watchlistError;

  function goToChart(symbol: string): void {
    // Reuses ChartPage's own store/action - not a second navigation
    // mechanism. `name`/`exchange` are left as the bare symbol/empty
    // string since WatchlistItem carries no company name - ChartPage only
    // ever displays `selectedSymbol.symbol` prominently, so this doesn't
    // read as broken, just less descriptive than a real search result.
    selectChartSymbol({ symbol, name: symbol, exchange: '' });
    navigate('/chart');
  }

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
        <StatCard label="Total Strategies" value={strategies?.length ?? 0} to="/strategies" />
        <StatCard label="Total Backtests" value={backtests?.length ?? 0} to="/backtests" />
        <StatCard label="Watchlist" value={watchlist?.length ?? 0} to="/watchlist" />
      </div>

      <QuickActions />

      <MarketOverview />

      <div className="grid gap-8 lg:grid-cols-2">
        <RecentSection
          title="Recent Backtests"
          viewAllHref="/backtests"
          isLoading={backtestsLoading}
          isError={backtestsError}
          isEmpty={Boolean(backtests) && backtests!.length === 0}
          emptyMessage="You haven't run any backtests yet."
        >
          {recentBacktests.map((run) => (
            <li key={run.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <Link to={`/backtests/${run.id}`} className="font-medium text-slate-100 hover:text-brand-300">
                  {run.symbol}
                </Link>
                <p className="truncate text-xs text-slate-500">
                  {strategyNameById.get(run.strategyId) ?? 'Strategy'} · {TIMEFRAME_LABELS[run.timeframe] ?? run.timeframe}
                  {run.status !== 'COMPLETED' && ` · ${BACKTEST_STATUS_LABEL[run.status] ?? run.status}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
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
                <Link
                  to={`/backtests/${run.id}`}
                  className="whitespace-nowrap text-sm font-medium text-brand-400 hover:text-brand-300"
                >
                  View Analysis →
                </Link>
              </div>
            </li>
          ))}
        </RecentSection>

        <RecentSection
          title="Recent Activity"
          viewAllHref="/backtests"
          isLoading={activityLoading}
          isError={Boolean(activityError)}
          isEmpty={!activityLoading && !activityError && recentActivity.length === 0}
          emptyMessage="Nothing yet - create a strategy, run a backtest, or add a stock to your watchlist."
        >
          {recentActivity.map((activity) => (
            <li key={activity.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-100">{activity.title}</p>
                <p className="truncate text-xs text-slate-500">{activity.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">{formatRelativeTime(activity.timestamp, new Date())}</span>
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
            <button
              type="button"
              onClick={() => goToChart(item.symbol)}
              className="font-medium text-slate-100 hover:text-brand-300"
            >
              {item.symbol}
            </button>
            <span className="text-xs text-slate-500">Added {new Date(item.addedAt).toLocaleDateString()}</span>
          </li>
        ))}
      </RecentSection>
    </div>
  );
}
