import type { BacktestRun, StrategySummary, WatchlistItem } from '@quantlab/shared-types';

export type ActivityType = 'strategy' | 'backtest' | 'watchlist';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  /** e.g. "Created strategy" / "Ran backtest" / "Added to watchlist". */
  title: string;
  /** e.g. a strategy name, "SYMBOL · Strategy Name", or a watchlist symbol. */
  detail: string;
  timestamp: string;
}

/**
 * A lightweight, client-side "Recent Activity" feed derived entirely from
 * data the Dashboard already fetches (`useStrategies`/`useBacktestsList`/
 * `useWatchlist`) - there is no activity/event-log table, and this
 * deliberately doesn't introduce one. Each existing record's own
 * createdAt/addedAt IS the activity timestamp; there's nothing to log
 * separately.
 *
 * Built-in/product-level content (`isBuiltIn: true` - see Group AH) is
 * excluded from every category: it wasn't something the CURRENT user did,
 * so surfacing it here would misrepresent whose activity this is (every
 * account would show identical "activity" from the moment it was seeded,
 * which isn't personalization - it's noise).
 */
export function buildRecentActivity(
  strategies: StrategySummary[],
  backtests: BacktestRun[],
  watchlist: WatchlistItem[],
  limit = 5,
): ActivityItem[] {
  const strategyNameById = new Map(strategies.map((strategy) => [strategy.id, strategy.name]));

  const strategyEvents: ActivityItem[] = strategies
    .filter((strategy) => !strategy.isBuiltIn)
    .map((strategy) => ({
      id: `strategy-${strategy.id}`,
      type: 'strategy',
      title: 'Created strategy',
      detail: strategy.name,
      timestamp: strategy.createdAt,
    }));

  const backtestEvents: ActivityItem[] = backtests
    .filter((run) => !run.isBuiltIn)
    .map((run) => ({
      id: `backtest-${run.id}`,
      type: 'backtest',
      title: 'Ran backtest',
      detail: `${run.symbol} · ${strategyNameById.get(run.strategyId) ?? 'Strategy'}`,
      timestamp: run.createdAt,
    }));

  const watchlistEvents: ActivityItem[] = watchlist
    .filter((item) => !item.isBuiltIn)
    .map((item) => ({
      id: `watchlist-${item.id}`,
      type: 'watchlist',
      title: 'Added to watchlist',
      detail: item.symbol,
      timestamp: item.addedAt,
    }));

  return [...strategyEvents, ...backtestEvents, ...watchlistEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Deliberately coarse (minutes/hours/"Yesterday"/days, then a plain date) -
 * a Dashboard activity feed reads better as "5 hours ago" than as an exact
 * timestamp, and coarse buckets avoid this needing to re-render every
 * second to stay accurate. `now` is a parameter (rather than reading
 * `Date.now()` internally) so this stays a pure, deterministic function -
 * easy to test, and easy for a caller to freeze at render time.
 */
export function formatRelativeTime(timestamp: string, now: Date): string {
  const then = new Date(timestamp).getTime();
  const diffMs = now.getTime() - then;

  if (diffMs < MINUTE_MS) return 'Just now';
  if (diffMs < HOUR_MS) {
    const minutes = Math.round(diffMs / MINUTE_MS);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (diffMs < DAY_MS) {
    const hours = Math.round(diffMs / HOUR_MS);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(diffMs / DAY_MS);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}
