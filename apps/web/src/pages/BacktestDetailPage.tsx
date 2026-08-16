import { useParams, Link } from 'react-router-dom';
import { TIMEFRAME_LABELS } from '@quantlab/shared-types';
import { useBacktest, useBacktestTrades } from '../features/backtests/useBacktests';
import { TradeTable } from '../features/backtests/TradeTable';
import { EquityCurve } from '../features/backtests/EquityCurve';
import { DrawdownChart } from '../features/backtests/DrawdownChart';
import { PerformanceCards } from '../features/backtests/PerformanceCards';
import { MonthlyPerformanceTable } from '../features/backtests/MonthlyPerformanceTable';
import { ReturnDistribution } from '../features/backtests/ReturnDistribution';
import { ExitReasonBreakdown } from '../features/backtests/ExitReasonBreakdown';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: 'Completed', cls: 'bg-profit/10 text-profit border-profit/20'    },
  FAILED:    { label: 'Failed',    cls: 'bg-loss/10 text-loss border-loss/20'          },
  RUNNING:   { label: 'Running',   cls: 'bg-warning/10 text-warning border-warning/20' },
  PENDING:   { label: 'Pending',   cls: 'bg-zinc-700/30 text-zinc-400 border-zinc-700' },
};

function StatusBadge({ status }: { status: string }) {
  const { label, cls } = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Key metric tile ──────────────────────────────────────────────────────────
function Metric({ label, value, tone }: {
  label: string;
  value: string;
  tone?: 'profit' | 'loss' | 'risk';
}) {
  const toneClass =
    tone === 'profit' ? 'text-profit' :
    (tone === 'loss' || tone === 'risk') ? 'text-loss' :
    'text-zinc-100';
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-zinc-600">{label}</dt>
      <dd className={`mt-1.5 text-xl font-semibold tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  );
}

// ─── Chart panel wrapper ──────────────────────────────────────────────────────
function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function formatPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}

// ─── BacktestDetailPage ───────────────────────────────────────────────────────
export function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: run, isLoading, isError } = useBacktest(id);
  const shouldFetchTrades = run?.status === 'COMPLETED';
  const { data: trades, isLoading: isLoadingTrades, isError: isTradesError } =
    useBacktestTrades(shouldFetchTrades ? id : undefined);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-zinc-800" />
        <div className="h-4 w-64 rounded bg-zinc-800" />
        <div className="h-32 rounded-lg bg-zinc-800" />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        Couldn&apos;t load this backtest.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-100">{run.symbol}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {TIMEFRAME_LABELS[run.timeframe] ?? run.timeframe}
            {' · '}
            {new Date(run.dateFrom).toLocaleDateString()} — {new Date(run.dateTo).toLocaleDateString()}
          </p>
        </div>
        <Link
          to="/backtests"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← All Backtests
        </Link>
      </div>

      {/* ── Key metrics ──────────────────────────────────────────────────── */}
      {run.status === 'COMPLETED' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Metric
              label="Total Return"
              value={formatPct(run.totalReturnPct)}
              tone={run.totalReturnPct === null ? undefined : run.totalReturnPct >= 0 ? 'profit' : 'loss'}
            />
            <Metric label="Win Rate"      value={formatPct(run.winRate)} />
            <Metric label="Profit Factor" value={run.profitFactor?.toFixed(2) ?? '—'} />
            <Metric label="Max Drawdown"  value={formatPct(run.maxDrawdownPct)} tone="risk" />
            <Metric label="Sharpe Ratio"  value={run.sharpeRatio?.toFixed(2) ?? '—'} />
            <Metric label="Total Trades"  value={run.totalTrades?.toString() ?? '—'} />
          </dl>
        </div>
      )}

      {/* Non-completed states */}
      {run.status === 'FAILED' && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Backtest failed</p>
          {run.errorMessage && (
            <p className="mt-1 text-sm text-red-400/70">{run.errorMessage}</p>
          )}
        </div>
      )}
      {(run.status === 'PENDING' || run.status === 'RUNNING') && (
        <div className="rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          This backtest hasn&apos;t finished yet. Refresh to check for updates.
        </div>
      )}

      {/* ── Analytics ───────────────────────────────────────────────────── */}
      {run.status === 'COMPLETED' && trades && (
        <div className="space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Analytics</h2>

          {/* Performance metric cards */}
          <PerformanceCards run={run} trades={trades} />

          {/* Charts 2×2 grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPanel title="Equity Curve">
              <EquityCurve trades={trades} />
            </ChartPanel>
            <ChartPanel title="Drawdown">
              <DrawdownChart trades={trades} />
            </ChartPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPanel title="Return Distribution">
              <ReturnDistribution trades={trades} />
            </ChartPanel>
            <ChartPanel title="Exit Reason Breakdown">
              <ExitReasonBreakdown trades={trades} />
            </ChartPanel>
          </div>

          {/* Monthly performance */}
          <MonthlyPerformanceTable trades={trades} />
        </div>
      )}

      {/* ── Trade log ────────────────────────────────────────────────────── */}
      {run.status === 'COMPLETED' && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Trade Log</h2>

          {isLoadingTrades && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-zinc-800/50" />
              ))}
            </div>
          )}
          {isTradesError && (
            <p className="text-sm text-red-400">Couldn&apos;t load the trade log.</p>
          )}
          {trades && <TradeTable trades={trades} />}
        </div>
      )}
    </div>
  );
}
