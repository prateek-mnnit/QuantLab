import type { Trade, TradeExitReason } from '@quantlab/shared-types';

const INITIAL_EQUITY_INDEX = 100;

export interface EquityPoint {
  time: number; // Unix seconds, matching the Candle/lightweight-charts convention used elsewhere in this app
  equity: number;
}

export interface DrawdownPoint {
  time: number;
  drawdownPct: number; // 0 at a new equity peak, negative below it
}

export interface PerformanceExtras {
  averageWin: number | null;
  averageLoss: number | null;
  largestWin: number | null;
  largestLoss: number | null;
  expectancy: number | null;
  averageTradeDurationHours: number | null;
}

export interface MonthlyPerformance {
  monthKey: string; // "2024-01" - stable sort key
  monthLabel: string; // "Jan 2024" - display label
  tradeCount: number;
  netPnl: number;
  profitPct: number;
  winRate: number;
}

export interface ReturnHistogramBucket {
  rangeLabel: string;
  count: number;
  isPositive: boolean;
}

export interface ExitReasonBreakdown {
  reason: TradeExitReason;
  label: string;
  count: number;
  pct: number; // % of closed trades that exited this way
}

export interface StreakStats {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

/**
 * A trade is "closed" (usable for analytics) once it has both a pnl and an
 * exit time - matches the same notion of "closed" the domain engine's own
 * MetricsCalculator uses server-side, just re-expressed here since the
 * frontend only has the serialized Trade DTO, not the domain types.
 */
export function getClosedTrades(trades: Trade[]): Array<Trade & { pnl: number; exitTime: string }> {
  return trades.filter((trade): trade is Trade & { pnl: number; exitTime: string } => trade.pnl !== null && trade.exitTime !== null);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toUnixSeconds(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

/**
 * Per-trade return, relative to the capital actually deployed in that
 * trade (pnl / (entryPrice * size)) rather than raw price return - this
 * accounts for position sizing. Intentionally NOT imported from
 * TradeTable.tsx (which has the same formula) since this group's
 * constraints explicitly exclude modifying the trade explorer - a ~3-line
 * duplication here is the deliberate tradeoff for that boundary.
 */
function computeTradeReturnPct(trade: Trade): number | null {
  if (trade.pnl === null || trade.entryPrice === 0 || trade.size === 0) return null;
  return (trade.pnl / (trade.entryPrice * trade.size)) * 100;
}

/**
 * Starts at an index of 100 (not the backtest's real dollar capital) and
 * compounds each closed trade's own return% onto it in exit-time order -
 * a normalized "how did $100 grow" curve, independent of whatever initial
 * capital the backtest itself used. The first point is seeded at the
 * first trade's ENTRY time so the chart has a real starting point instead
 * of jumping in already mid-curve.
 */
export function computeEquityCurve(trades: Trade[]): EquityPoint[] {
  const closed = getClosedTrades(trades)
    .slice()
    .sort((a, b) => new Date(a.exitTime as string).getTime() - new Date(b.exitTime as string).getTime());

  if (closed.length === 0) return [];

  let equity = INITIAL_EQUITY_INDEX;
  const points: EquityPoint[] = [{ time: toUnixSeconds(closed[0]!.entryTime), equity }];

  for (const trade of closed) {
    const returnPct = computeTradeReturnPct(trade);
    if (returnPct === null) continue;
    equity = equity * (1 + returnPct / 100);
    points.push({ time: toUnixSeconds(trade.exitTime as string), equity });
  }

  return points;
}

/** Derives drawdown % from an already-computed equity curve - never recomputes equity itself. */
export function computeDrawdownCurve(equityCurve: EquityPoint[]): DrawdownPoint[] {
  let peak = equityCurve[0]?.equity ?? INITIAL_EQUITY_INDEX;
  return equityCurve.map((point) => {
    peak = Math.max(peak, point.equity);
    const drawdownPct = peak === 0 ? 0 : ((point.equity - peak) / peak) * 100;
    return { time: point.time, drawdownPct };
  });
}

/**
 * Only the per-trade figures the BacktestRun DTO doesn't already carry
 * (profitFactor/winRate/totalReturnPct/maxDrawdownPct come from the
 * server's own MetricsCalculator and are reused as-is by PerformanceCards,
 * not recomputed here).
 */
export function computePerformanceExtras(trades: Trade[]): PerformanceExtras {
  const closed = getClosedTrades(trades);
  if (closed.length === 0) {
    return {
      averageWin: null,
      averageLoss: null,
      largestWin: null,
      largestLoss: null,
      expectancy: null,
      averageTradeDurationHours: null,
    };
  }

  const wins = closed.filter((trade) => trade.pnl > 0);
  const losses = closed.filter((trade) => trade.pnl < 0);

  const durationsHours = closed.map(
    (trade) => (new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime()) / (1000 * 60 * 60),
  );

  return {
    averageWin: wins.length > 0 ? average(wins.map((trade) => trade.pnl)) : null,
    averageLoss: losses.length > 0 ? average(losses.map((trade) => trade.pnl)) : null,
    largestWin: wins.length > 0 ? Math.max(...wins.map((trade) => trade.pnl)) : null,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((trade) => trade.pnl)) : null,
    // Expectancy: average $ pnl per trade across EVERY closed trade (wins
    // and losses together) - "how much do I expect to make per trade."
    expectancy: average(closed.map((trade) => trade.pnl)),
    averageTradeDurationHours: average(durationsHours),
  };
}

/**
 * Grouped by the trade's EXIT month (UTC) - a trade's outcome is realized
 * when it closes, so that's the month its P&L belongs to, not its entry
 * month. `profitPct` sums each trade's own return% within the month - a
 * simple additive approximation (not compounded) chosen for transparency
 * in a summary table, consistent with how the return distribution below
 * also treats each trade's return independently.
 */
export function computeMonthlyPerformance(trades: Trade[]): MonthlyPerformance[] {
  const closed = getClosedTrades(trades);
  const byMonth = new Map<string, Array<Trade & { pnl: number; exitTime: string }>>();

  for (const trade of closed) {
    const exitDate = new Date(trade.exitTime);
    const monthKey = `${exitDate.getUTCFullYear()}-${String(exitDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const existing = byMonth.get(monthKey);
    if (existing) {
      existing.push(trade);
    } else {
      byMonth.set(monthKey, [trade]);
    }
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, monthTrades]) => {
      const netPnl = monthTrades.reduce((sum, trade) => sum + trade.pnl, 0);
      const profitPct = monthTrades.reduce((sum, trade) => sum + (computeTradeReturnPct(trade) ?? 0), 0);
      const wins = monthTrades.filter((trade) => trade.pnl > 0).length;
      const [year, month] = monthKey.split('-').map(Number);
      const monthLabel = new Date(Date.UTC(year!, month! - 1, 1)).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });

      return {
        monthKey,
        monthLabel,
        tradeCount: monthTrades.length,
        netPnl,
        profitPct,
        winRate: (wins / monthTrades.length) * 100,
      };
    });
}

/** Buckets every closed trade's return% into `bucketCount` equal-width ranges spanning the observed min/max. */
export function computeReturnHistogram(trades: Trade[], bucketCount = 10): ReturnHistogramBucket[] {
  const returns = getClosedTrades(trades)
    .map(computeTradeReturnPct)
    .filter((value): value is number => value !== null);

  if (returns.length === 0) return [];

  const min = Math.min(...returns);
  const max = Math.max(...returns);
  // A degenerate range (every trade had the identical return%) would
  // otherwise divide by zero when computing bucket width.
  const range = max - min || 1;
  const bucketWidth = range / bucketCount;

  const buckets: ReturnHistogramBucket[] = Array.from({ length: bucketCount }, (_, index) => {
    const bucketMin = min + index * bucketWidth;
    return {
      rangeLabel: `${bucketMin.toFixed(1)}% to ${(bucketMin + bucketWidth).toFixed(1)}%`,
      count: 0,
      isPositive: bucketMin >= 0,
    };
  });

  for (const value of returns) {
    const index = Math.min(bucketCount - 1, Math.floor((value - min) / bucketWidth));
    buckets[index]!.count += 1;
  }

  return buckets;
}

/**
 * Duplicated from TradeTable.tsx's own `EXIT_REASON_LABEL`, same
 * deliberate tradeoff already explained above for `computeTradeReturnPct`:
 * this module doesn't import from a component file, and this group's
 * constraints don't touch the trade explorer - a 5-line label map isn't
 * worth crossing that boundary for.
 */
const EXIT_REASON_LABEL: Record<string, string> = {
  TAKE_PROFIT: 'Take Profit',
  STOP_LOSS: 'Stop Loss',
  TRAILING_STOP: 'Trailing Stop',
  EXIT_SIGNAL: 'Exit Signal',
  END_OF_BACKTEST: 'End of Backtest',
};

/**
 * How each closed trade actually ended - data the engine has always
 * recorded per-trade (`Trade.exitReason`, shown per-row in TradeTable
 * already) but never summarized. Only reasons that actually occurred are
 * included (no padded zero-count rows), sorted most-common first, since
 * that's the more useful reading order for "what's mostly driving my
 * exits."
 */
export function computeExitReasonBreakdown(trades: Trade[]): ExitReasonBreakdown[] {
  const closed = getClosedTrades(trades).filter((trade) => trade.exitReason !== null);
  if (closed.length === 0) return [];

  const counts = new Map<string, number>();
  for (const trade of closed) {
    const reason = trade.exitReason as TradeExitReason;
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([reason, count]) => ({
      reason: reason as TradeExitReason,
      label: EXIT_REASON_LABEL[reason] ?? reason,
      count,
      pct: (count / closed.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * The longest run of consecutive wins and the longest run of consecutive
 * losses, walking closed trades in the same exit-time order every other
 * analytic here uses. A breakeven trade (`pnl === 0`) is neither a win nor
 * a loss and breaks both streaks - it's a real outcome, not noise to fold
 * into one side or the other. This is a risk/psychology metric standard
 * backtest reports include alongside win rate: win rate alone doesn't say
 * how bad a losing streak can run, which matters for whether a trader
 * could actually stick with the strategy through one.
 */
export function computeStreaks(trades: Trade[]): StreakStats {
  const closed = getClosedTrades(trades)
    .slice()
    .sort((a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime());

  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const trade of closed) {
    if (trade.pnl > 0) {
      currentWinStreak += 1;
      currentLossStreak = 0;
    } else if (trade.pnl < 0) {
      currentLossStreak += 1;
      currentWinStreak = 0;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
    maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
    maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
  }

  return { maxConsecutiveWins, maxConsecutiveLosses };
}
