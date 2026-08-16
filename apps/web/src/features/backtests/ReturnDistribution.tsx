import { useMemo } from 'react';
import type { Trade } from '@quantlab/shared-types';
import { computeReturnHistogram } from './backtestAnalytics';

interface ReturnDistributionProps {
  trades: Trade[];
}

/**
 * Plain div bars, not a charting library or SVG - a histogram is just a
 * bounded set of proportional heights, which Tailwind's flex utilities
 * express directly without any extra dependency. `group`/`group-hover`
 * gives each bar a tooltip with its exact range and count on hover.
 */
export function ReturnDistribution({ trades }: ReturnDistributionProps) {
  const buckets = useMemo(() => computeReturnHistogram(trades), [trades]);

  if (buckets.length === 0) {
    return <p className="text-sm text-zinc-500">Not enough data to show a return distribution.</p>;
  }

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="flex h-40 items-end gap-1">
      {buckets.map((bucket) => (
        <div key={bucket.rangeLabel} className="group relative flex h-full flex-1 flex-col items-center justify-end">
          <div
            className={`w-full rounded-t transition-colors ${bucket.isPositive ? 'bg-profit/70' : 'bg-loss/70'}`}
            style={{ height: `${(bucket.count / maxCount) * 100}%`, minHeight: bucket.count > 0 ? '2px' : '0' }}
          />
          <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 shadow-lg group-hover:block">
            {bucket.rangeLabel}: {bucket.count} trade{bucket.count === 1 ? '' : 's'}
          </div>
        </div>
      ))}
    </div>
  );
}
