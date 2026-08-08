import { useParams } from 'react-router-dom';
import { TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useBacktest, useBacktestTrades } from '../features/backtests/useBacktests';
import { TradeTable } from '../features/backtests/TradeTable';
import { EquityCurve } from '../features/backtests/EquityCurve';
import { DrawdownChart } from '../features/backtests/DrawdownChart';
import { PerformanceCards } from '../features/backtests/PerformanceCards';
import { MonthlyPerformanceTable } from '../features/backtests/MonthlyPerformanceTable';
import { ReturnDistribution } from '../features/backtests/ReturnDistribution';
import { ExitReasonBreakdown } from '../features/backtests/ExitReasonBreakdown';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

function formatPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

/**
 * Where "Run Backtest" lands: run status/summary metrics (Group P), an
 * analytics section - equity curve, drawdown, performance cards (now
 * including max win/loss streaks), monthly table, return distribution, and
 * exit reason breakdown (Group AE adds the streak cards and the exit
 * reason chart; everything else in Analytics predates it) - and the full
 * trade log with expandable entry/exit explanations (Group Q). Strategy
 * comparison is still excluded, on purpose.
 */
export function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, isLoading, isError } = useBacktest(id);
  // Only fetch trades once the run has actually finished - a PENDING/
  // RUNNING run has none yet, and a FAILED run never produced any.
  const shouldFetchTrades = run?.status === 'COMPLETED';
  const {
    data: trades,
    isLoading: isLoadingTrades,
    isError: isTradesError,
  } = useBacktestTrades(shouldFetchTrades ? id : undefined);

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading backtest...</p>;
  }

  if (isError || !run) {
    return <p className="text-sm text-loss">Couldn&apos;t load this backtest.</p>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">{run.symbol} backtest</h1>
        <p className="mt-1 text-sm text-slate-400">
          {TIMEFRAME_LABELS[run.timeframe] ?? run.timeframe} ·{' '}
          {new Date(run.dateFrom).toLocaleDateString()} - {new Date(run.dateTo).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-6">
        <p className="text-sm font-medium text-slate-300">
          Status: <span className="text-slate-100">{STATUS_LABEL[run.status] ?? run.status}</span>
        </p>

        {run.status === 'FAILED' && run.errorMessage && (
          <p className="mt-2 text-sm text-loss">{run.errorMessage}</p>
        )}

        {(run.status === 'PENDING' || run.status === 'RUNNING') && (
          <p className="mt-2 text-sm text-slate-400">This backtest hasn&apos;t finished yet.</p>
        )}

        {run.status === 'COMPLETED' && (
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Total return" value={formatPct(run.totalReturnPct)} />
            <Metric label="Win rate" value={formatPct(run.winRate)} />
            <Metric label="Profit factor" value={run.profitFactor?.toFixed(2) ?? '—'} />
            <Metric label="Max drawdown" value={formatPct(run.maxDrawdownPct)} />
            <Metric label="Sharpe ratio" value={run.sharpeRatio?.toFixed(2) ?? '—'} />
            <Metric label="Total trades" value={run.totalTrades?.toString() ?? '—'} />
          </dl>
        )}
      </div>

      {run.status === 'COMPLETED' && trades && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-slate-200">Analytics</h2>

          <PerformanceCards run={run} trades={trades} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Equity Curve
              </p>
              <EquityCurve trades={trades} />
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Drawdown
              </p>
              <DrawdownChart trades={trades} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Return Distribution
              </p>
              <ReturnDistribution trades={trades} />
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Exit Reason Breakdown
              </p>
              <ExitReasonBreakdown trades={trades} />
            </div>
          </div>

          <MonthlyPerformanceTable trades={trades} />
        </div>
      )}

      {run.status === 'COMPLETED' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Trades</h2>

          {isLoadingTrades && <p className="text-sm text-slate-400">Loading trades...</p>}

          {isTradesError && (
            <p className="text-sm text-loss">Couldn&apos;t load the trade log for this backtest.</p>
          )}

          {trades && <TradeTable trades={trades} />}
        </div>
      )}
    </div>
  );
}
