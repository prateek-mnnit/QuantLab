import { useMemo } from 'react';
import type { BacktestRun, Trade } from '@quantlab/shared-types';
import { computePerformanceExtras, computeStreaks } from './backtestAnalytics';

interface PerformanceCardsProps {
  run: BacktestRun;
  trades: Trade[];
}

function formatCurrency(value: number | null): string {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}
function formatPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}
function formatDuration(hours: number | null): string {
  if (hours === null) return '—';
  return hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`;
}

function Card({ label, value, tone }: { label: string; value: string; tone?: 'profit' | 'loss' }) {
  const toneClass = tone === 'profit' ? 'text-profit' : tone === 'loss' ? 'text-loss' : 'text-slate-100';
  return (
    <div className="rounded-lg border border-surface-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

/**
 * Reuses the run's own server-computed metrics (totalReturnPct, winRate,
 * profitFactor, maxDrawdownPct - all from the domain engine's
 * MetricsCalculator, via the BacktestRun the page already fetched) rather
 * than recalculating them client-side, per the requirement to reuse
 * existing metrics where available. The per-trade figures the API doesn't
 * return (avg/largest win/loss, expectancy, avg duration, and - Group AE -
 * max consecutive win/loss streaks) are computed here, memoized to trade
 * identity.
 */
export function PerformanceCards({ run, trades }: PerformanceCardsProps) {
  const extras = useMemo(() => computePerformanceExtras(trades), [trades]);
  const streaks = useMemo(() => computeStreaks(trades), [trades]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card
        label="Total Return"
        value={formatPct(run.totalReturnPct)}
        tone={run.totalReturnPct !== null && run.totalReturnPct >= 0 ? 'profit' : 'loss'}
      />
      <Card label="Win Rate" value={formatPct(run.winRate)} />
      <Card label="Profit Factor" value={run.profitFactor?.toFixed(2) ?? '—'} />
      <Card label="Max Drawdown" value={formatPct(run.maxDrawdownPct)} tone="loss" />
      <Card
        label="Expectancy"
        value={formatCurrency(extras.expectancy)}
        tone={extras.expectancy !== null && extras.expectancy >= 0 ? 'profit' : 'loss'}
      />
      <Card label="Average Win" value={formatCurrency(extras.averageWin)} tone="profit" />
      <Card label="Average Loss" value={formatCurrency(extras.averageLoss)} tone="loss" />
      <Card label="Largest Win" value={formatCurrency(extras.largestWin)} tone="profit" />
      <Card label="Largest Loss" value={formatCurrency(extras.largestLoss)} tone="loss" />
      <Card label="Avg Trade Duration" value={formatDuration(extras.averageTradeDurationHours)} />
      <Card label="Max Win Streak" value={streaks.maxConsecutiveWins.toString()} tone="profit" />
      <Card label="Max Loss Streak" value={streaks.maxConsecutiveLosses.toString()} tone="loss" />
    </div>
  );
}
