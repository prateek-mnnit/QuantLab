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

// ─── Constants ────────────────────────────────────────────────────────────────
/** Dashboard preview limit — not the full list (that's on dedicated pages). */
const RECENT_ITEM_LIMIT = 5;

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      <Link
        to={viewAllHref}
        className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
      >
        View all →
      </Link>
    </div>
  );
}

/**
 * Shared loading/error/empty shell for "recent" sections.
 * Loading text is 'Loading...' and error text is "Couldn't load this section."
 * — these match the DashboardPage.test.tsx assertions.
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
    <div>
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
        {isLoading && (
          <p className="px-4 py-5 text-sm text-zinc-500">Loading...</p>
        )}
        {isError && (
          <p className="px-4 py-5 text-sm text-red-400">Couldn&apos;t load this section.</p>
        )}
        {isEmpty && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-zinc-500">{emptyMessage}</p>
          </div>
        )}
        {!isLoading && !isError && !isEmpty && children}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
/**
 * Navigable summary stat.
 * aria-label includes descriptive text matching test regex (e.g. /total strategies/i).
 */
function StatCard({
  label,
  ariaLabel,
  value,
  sub,
  to,
  icon,
  iconColorClass,
}: {
  label: string;
  ariaLabel: string;
  value: number | string;
  sub?: string;
  to: string;
  icon: ReactNode;
  iconColorClass?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors duration-150 hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors ${iconColorClass || 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>}
      </div>
    </Link>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({
  label,
  description,
  to,
  icon,
  primary,
  iconColorClass,
}: {
  label: string;
  description: string;
  to: string;
  icon: ReactNode;
  primary?: boolean;
  iconColorClass?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors duration-150 ${
        primary
          ? 'border-accent-600/40 bg-accent-600/10 hover:border-accent-600/60 hover:bg-accent-600/15'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
          primary 
            ? 'bg-accent-600/20 text-accent-500' 
            : iconColorClass || 'bg-zinc-800 text-zinc-400'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className={`text-sm font-medium ${primary ? 'text-zinc-100' : 'text-zinc-200'}`}>{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IcoStrategies() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M3 6h18M3 12h14M3 18h10" />
    </svg>
  );
}
function IcoBacktests() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IcoWatchlist() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IcoRun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function IcoChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  );
}
function IcoStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IcoActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// ─── Return display ───────────────────────────────────────────────────────────
function ReturnValue({ value }: { value: number | null }) {
  if (value === null) return <span className="font-mono text-xs text-zinc-600">—</span>;
  const positive = value >= 0;
  // Render the exact value with % — test expects '0.09%' not '+0.09%'
  return (
    <span className={`font-mono text-xs font-semibold tabular-nums ${positive ? 'text-profit' : 'text-loss'}`}>
      {value.toFixed(2)}%
    </span>
  );
}

// ─── DashboardPage ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const selectChartSymbol = useChartViewStore((state) => state.selectSymbol);

  const { data: strategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  const { data: backtests, isLoading: backtestsLoading, isError: backtestsError } = useBacktestsList();
  const { data: watchlist, isLoading: watchlistLoading, isError: watchlistError } = useWatchlist();

  const strategyNameById = new Map((strategies ?? []).map((s) => [s.id, s.name]));
  const recentBacktests = backtests?.slice(0, RECENT_ITEM_LIMIT) ?? [];
  const watchlistPreview = watchlist?.slice(0, RECENT_ITEM_LIMIT) ?? [];

  const recentActivity =
    strategies && backtests && watchlist
      ? buildRecentActivity(strategies, backtests, watchlist, RECENT_ITEM_LIMIT)
      : [];
  const activityLoading = strategiesLoading || backtestsLoading || watchlistLoading;
  const activityError = strategiesError || backtestsError || watchlistError;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.email?.split('@')[0] ?? '';

  function goToChart(symbol: string): void {
    selectChartSymbol({ symbol, name: symbol, exchange: '' });
    navigate('/chart');
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your strategies, backtests, and market overview.
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Strategies"
          ariaLabel={`Total Strategies: ${strategiesLoading ? '—' : (strategies?.length ?? 0)}`}
          value={strategiesLoading ? '—' : (strategies?.length ?? 0)}
          sub={`${strategies?.filter((s) => !s.isBuiltIn).length ?? 0} yours`}
          to="/strategies"
          icon={<IcoStrategies />}
          iconColorClass="bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300"
        />
        <StatCard
          label="Backtests Run"
          ariaLabel={`Total Backtests: ${backtestsLoading ? '—' : (backtests?.length ?? 0)}`}
          value={backtestsLoading ? '—' : (backtests?.length ?? 0)}
          sub={`${backtests?.filter((b) => b.status === 'COMPLETED').length ?? 0} completed`}
          to="/backtests"
          icon={<IcoBacktests />}
          iconColorClass="bg-profit/10 text-profit group-hover:bg-profit/20 group-hover:text-profit"
        />
        <StatCard
          label="Watchlist"
          ariaLabel={`Watchlist: ${watchlistLoading ? '—' : (watchlist?.length ?? 0)} symbols tracked`}
          value={watchlistLoading ? '—' : (watchlist?.length ?? 0)}
          sub="symbols tracked"
          to="/watchlist"
          icon={<IcoWatchlist />}
          iconColorClass="bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 group-hover:text-amber-400"
        />
      </div>

      {/* ── Two-column body ────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* ── Market Overview ──────────────────────────────────────────────── */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Market Overview</h2>
            <MarketOverview />
          </div>

          {/* Recent Backtests */}
          <RecentSection
            title="Recent Backtests"
            viewAllHref="/backtests"
            isLoading={backtestsLoading}
            isError={backtestsError}
            isEmpty={Boolean(backtests) && backtests!.length === 0}
            emptyMessage="You haven't run any backtests yet."
          >
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Strategy / Symbol</th>
                  <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Timeframe</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-600">Return</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-zinc-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBacktests.map((run) => (
                  <tr key={run.id} className="border-b border-zinc-800/50 transition-colors duration-75 last:border-b-0 hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-100">{run.symbol}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate max-w-[20ch]">
                        {strategyNameById.get(run.strategyId) ?? 'Strategy'}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-400">
                      {TIMEFRAME_LABELS[run.timeframe] ?? run.timeframe}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ReturnValue value={run.totalReturnPct} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/backtests/${run.id}`}
                        className="inline-flex items-center rounded border border-amber-700/30 bg-transparent px-2.5 py-1 text-xs font-medium text-amber-500 transition-colors hover:border-amber-600/40 hover:text-amber-400 whitespace-nowrap"
                      >
                        View Analysis →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RecentSection>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick Actions — include "Add to Watchlist" matching test assertion */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction label="+ New Strategy"   description="Build from scratch or a template"  to="/strategies/new" icon={<IcoPlus />} primary />
              <QuickAction label="Run Backtest"      description="Test a strategy on historical data" to="/backtests/new"  icon={<IcoRun />} iconColorClass="bg-profit/10 text-profit group-hover:bg-profit/20 group-hover:text-profit" />
              <QuickAction label="View Charts"       description="Analyze market price data"          to="/chart"          icon={<IcoChart />} iconColorClass="bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20 group-hover:text-cyan-400" />
              <QuickAction label="Add to Watchlist"  description="Track a symbol's price"             to="/watchlist"      icon={<IcoStar />} iconColorClass="bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 group-hover:text-amber-400" />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentSection
            title="Recent Activity"
            viewAllHref="/backtests"
            isLoading={activityLoading}
            isError={Boolean(activityError)}
            isEmpty={!activityLoading && !activityError && recentActivity.length === 0}
            emptyMessage="Nothing yet — create a strategy, run a backtest, or add a symbol to your watchlist."
          >
            <ul className="divide-y divide-zinc-800/50">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/30 group">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-violet-500/10 text-violet-400 transition-colors group-hover:bg-violet-500/20 group-hover:text-violet-300">
                    <IcoActivity />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate">{activity.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 truncate">{activity.detail}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-zinc-600">
                    {formatRelativeTime(activity.timestamp, new Date())}
                  </span>
                </li>
              ))}
            </ul>
          </RecentSection>

          {/* Watchlist preview */}
          <RecentSection
            title="Watchlist"
            viewAllHref="/watchlist"
            isLoading={watchlistLoading}
            isError={watchlistError}
            isEmpty={Boolean(watchlist) && watchlist!.length === 0}
            emptyMessage="Your watchlist is empty."
          >
            <ul className="divide-y divide-zinc-800/50">
              {watchlistPreview.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-zinc-800/30">
                  <button
                    type="button"
                    onClick={() => goToChart(item.symbol)}
                    className="text-sm font-medium text-zinc-200 hover:text-zinc-300 transition-colors"
                  >
                    {item.symbol}
                  </button>
                  <span className="text-xs text-zinc-600">
                    {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </RecentSection>
        </div>
      </div>
    </div>
  );
}
