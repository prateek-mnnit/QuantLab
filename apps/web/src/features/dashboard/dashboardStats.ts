import type { BacktestRun, StrategySummary } from '@quantlab/shared-types';

export interface StrategyCounts {
  total: number;
  builtIn: number;
  custom: number;
}

/**
 * "Built-in vs yours" split for the Total Strategies stat card - both
 * numbers come straight from the `isBuiltIn` flag already on every fetched
 * `StrategySummary` (the same flag `recentActivity.ts` filters on), so this
 * needs no extra request.
 */
export function computeStrategyCounts(strategies: StrategySummary[]): StrategyCounts {
  const builtIn = strategies.filter((strategy) => strategy.isBuiltIn).length;
  return { total: strategies.length, builtIn, custom: strategies.length - builtIn };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/**
 * How many backtests were created in the last 7 days, for the "Backtests
 * Run" stat card's "+N this week" subtitle. `now` is a parameter (not
 * `Date.now()` internally) for the same reason as `formatRelativeTime` in
 * recentActivity.ts - a pure, deterministic function that's trivial to
 * test and easy for a caller to freeze at render time.
 */
export function computeBacktestsThisWeek(backtests: BacktestRun[], now: Date): number {
  const cutoff = now.getTime() - WEEK_MS;
  return backtests.filter((run) => new Date(run.createdAt).getTime() >= cutoff).length;
}

export interface SuccessRate {
  percent: number;
  profitableCount: number;
  completedCount: number;
}

/**
 * Share of COMPLETED backtests with a positive return, for the Success
 * Rate stat card. Only counts runs that actually finished with a real
 * return figure - a PENDING/RUNNING/FAILED run, or a COMPLETED one with a
 * null `totalReturnPct` (shouldn't normally happen, but the type allows
 * it), isn't a meaningful data point for "was this profitable". Returns
 * `null` when there's no such run yet, so the card can show an honest "—"
 * instead of a misleading 0%.
 */
export function computeSuccessRate(backtests: BacktestRun[]): SuccessRate | null {
  const completed = backtests.filter(
    (run): run is BacktestRun & { totalReturnPct: number } => run.status === 'COMPLETED' && run.totalReturnPct !== null,
  );
  if (completed.length === 0) return null;

  const profitableCount = completed.filter((run) => run.totalReturnPct > 0).length;
  return {
    percent: (profitableCount / completed.length) * 100,
    profitableCount,
    completedCount: completed.length,
  };
}

/**
 * Compact "Dec 1 – Dec 7, 2024" style range for a Recent Backtests row,
 * from the same `dateFrom`/`dateTo` every `BacktestRun` already carries
 * (the exact date range that was actually backtested) - no new data.
 *
 * Explicitly formatted in UTC: `dateFrom`/`dateTo` are UTC-midnight ISO
 * timestamps representing calendar dates, not moments in the viewer's
 * local time - formatting them in the browser's local timezone could
 * shift the displayed date by a day depending on where the viewer is.
 */
export function formatBacktestPeriod(dateFrom: string, dateTo: string): string {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const fromLabel = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const toLabel = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${fromLabel} \u2013 ${toLabel}`;
}
