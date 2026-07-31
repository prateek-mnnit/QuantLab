import { useParams } from 'react-router-dom';
import { useBacktest } from '../features/backtests/useBacktests';

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
 * Deliberately NOT the full analytics/results UI (equity curve, trade log,
 * per-trade explainability) - that's a separate, larger group. This is
 * where "Run Backtest" lands today: real data from the already-built
 * GET /backtests/:id endpoint (status, error message on failure, summary
 * metrics on success), not a fabricated placeholder - the full results
 * page will build on this same hook rather than replace it.
 */
export function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, isLoading, isError } = useBacktest(id);

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading backtest...</p>;
  }

  if (isError || !run) {
    return <p className="text-sm text-loss">Couldn&apos;t load this backtest.</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">{run.symbol} backtest</h1>
        <p className="mt-1 text-sm text-slate-400">
          {run.timeframe === '1D' ? 'Daily' : 'Weekly'} ·{' '}
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

        <p className="mt-6 text-xs text-slate-500">
          Full trade-by-trade analytics and the equity curve are coming in a future update.
        </p>
      </div>
    </div>
  );
}
