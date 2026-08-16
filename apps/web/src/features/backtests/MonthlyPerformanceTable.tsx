import { useMemo } from 'react';
import type { Trade } from '@quantlab/shared-types';
import { computeMonthlyPerformance } from './backtestAnalytics';

interface MonthlyPerformanceTableProps {
  trades: Trade[];
}

/**
 * Renders nothing (not a near-empty table) when there are fewer than 2
 * distinct months of closed trades - a single month can't show anything
 * meaningfully "monthly," matching the requirement to display this table
 * only "if enough data exists."
 */
export function MonthlyPerformanceTable({ trades }: MonthlyPerformanceTableProps) {
  const months = useMemo(() => computeMonthlyPerformance(trades), [trades]);

  if (months.length < 2) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80">
          <tr>
            <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Month</th>
            <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Trades</th>
            <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Profit %</th>
            <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Net P&amp;L</th>
            <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600">Win Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {months.map((month) => (
            <tr key={month.monthKey} className="transition-colors hover:bg-zinc-800/30">
              <td className="px-3 py-2.5 text-sm text-zinc-200">{month.monthLabel}</td>
              <td className="px-3 py-2.5 text-sm tabular-nums text-zinc-500">{month.tradeCount}</td>
              <td className={`px-3 py-2.5 text-sm font-semibold tabular-nums ${month.profitPct >= 0 ? 'text-profit' : 'text-loss'}`}>
                {month.profitPct.toFixed(2)}%
              </td>
              <td className={`px-3 py-2.5 text-sm font-semibold tabular-nums ${month.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {month.netPnl.toFixed(2)}
              </td>
              <td className="px-3 py-2.5 text-sm tabular-nums text-zinc-500">{month.winRate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
