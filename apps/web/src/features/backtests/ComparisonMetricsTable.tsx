import type { BacktestRun } from '@quantlab/shared-types';

interface ComparisonMetricsTableProps {
  runs: BacktestRun[];
}

interface MetricRow {
  label: string;
  format: (run: BacktestRun) => string;
  tone?: (run: BacktestRun) => 'profit' | 'loss' | undefined;
}

const METRIC_ROWS: MetricRow[] = [
  {
    label: 'Total Return',
    format: (run) => (run.totalReturnPct !== null ? `${run.totalReturnPct.toFixed(2)}%` : '—'),
    tone: (run) => (run.totalReturnPct === null ? undefined : run.totalReturnPct >= 0 ? 'profit' : 'loss'),
  },
  { label: 'CAGR', format: (run) => (run.cagr !== null ? `${run.cagr.toFixed(2)}%` : '—') },
  { label: 'Win Rate', format: (run) => (run.winRate !== null ? `${run.winRate.toFixed(2)}%` : '—') },
  { label: 'Profit Factor', format: (run) => run.profitFactor?.toFixed(2) ?? '—' },
  {
    label: 'Max Drawdown',
    format: (run) => (run.maxDrawdownPct !== null ? `${run.maxDrawdownPct.toFixed(2)}%` : '—'),
    tone: () => 'loss',
  },
  { label: 'Sharpe Ratio', format: (run) => run.sharpeRatio?.toFixed(2) ?? '—' },
  { label: 'Total Trades', format: (run) => run.totalTrades?.toString() ?? '—' },
];

/**
 * Every figure here is reused directly from each BacktestRun's own
 * server-computed metrics (the domain engine's MetricsCalculator) - no
 * client-side recalculation, the same treatment PerformanceCards already
 * gives these same fields on the single-run detail page.
 */
export function ComparisonMetricsTable({ runs }: ComparisonMetricsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80">
          <tr>
            <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Metric</th>
            {runs.map((run) => (
              <th key={run.id} className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">
                {run.symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {METRIC_ROWS.map((row) => (
            <tr key={row.label} className="transition-colors hover:bg-zinc-800/30">
              <td className="px-3 py-2.5 text-sm text-zinc-500">{row.label}</td>
              {runs.map((run) => {
                const tone = row.tone?.(run);
                const toneClass = tone === 'profit' ? 'text-profit' : tone === 'loss' ? 'text-loss' : 'text-zinc-100';
                return (
                  <td key={run.id} className={`px-3 py-2.5 font-mono text-sm font-semibold tabular-nums ${toneClass}`}>
                    {row.format(run)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
