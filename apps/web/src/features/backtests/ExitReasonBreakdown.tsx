import { useMemo } from 'react';
import type { Trade } from '@quantlab/shared-types';
import { computeExitReasonBreakdown } from './backtestAnalytics';

interface ExitReasonBreakdownProps {
  trades: Trade[];
}

/**
 * `TradeTable` already shows each trade's individual exit reason, but
 * there was previously no way to see the shape of that data across an
 * entire run at a glance - e.g. "most of my losses come from stop-outs,
 * not the strategy's own exit signal" is a very different (and useful)
 * read than scanning a trade-by-trade list. Horizontal bars (rather than
 * ReturnDistribution's vertical histogram) since these are five
 * unordered, independently-labeled categories, not a continuous numeric
 * range - a horizontal bar-per-category list reads more naturally for
 * that shape of data.
 */
export function ExitReasonBreakdown({ trades }: ExitReasonBreakdownProps) {
  const breakdown = useMemo(() => computeExitReasonBreakdown(trades), [trades]);

  if (breakdown.length === 0) {
    return <p className="text-sm text-slate-500">Not enough data to show an exit reason breakdown.</p>;
  }

  const maxCount = Math.max(...breakdown.map((row) => row.count));

  return (
    <div className="space-y-3">
      {breakdown.map((row) => (
        <div key={row.reason} className="flex items-center gap-3">
          <p className="w-32 shrink-0 text-xs text-slate-400">{row.label}</p>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${(row.count / maxCount) * 100}%` }}
            />
          </div>
          <p className="w-20 shrink-0 text-right text-xs text-slate-400">
            {row.count} ({row.pct.toFixed(0)}%)
          </p>
        </div>
      ))}
    </div>
  );
}
