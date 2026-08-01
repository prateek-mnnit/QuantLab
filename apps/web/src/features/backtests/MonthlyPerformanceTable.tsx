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
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Month</th>
            <th className="px-4 py-3 font-medium">Trades</th>
            <th className="px-4 py-3 font-medium">Profit %</th>
            <th className="px-4 py-3 font-medium">Net P&amp;L</th>
            <th className="px-4 py-3 font-medium">Win Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {months.map((month) => (
            <tr key={month.monthKey} className="text-slate-200">
              <td className="px-4 py-3">{month.monthLabel}</td>
              <td className="px-4 py-3 text-slate-400">{month.tradeCount}</td>
              <td className={`px-4 py-3 font-medium ${month.profitPct >= 0 ? 'text-profit' : 'text-loss'}`}>
                {month.profitPct.toFixed(2)}%
              </td>
              <td className={`px-4 py-3 font-medium ${month.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {month.netPnl.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-slate-400">{month.winRate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
