import { memo, useState } from 'react';
import type { Trade } from '@quantlab/shared-types';
import { TradeExplanation } from './TradeExplanation';

const EXIT_REASON_LABEL: Record<string, string> = {
  TAKE_PROFIT: 'Take Profit',
  STOP_LOSS: 'Stop Loss',
  TRAILING_STOP: 'Trailing Stop',
  EXIT_SIGNAL: 'Exit Signal',
  END_OF_BACKTEST: 'End of Backtest',
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function formatPrice(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

/**
 * Return relative to the actual capital deployed in this trade
 * (pnl / (entryPrice * size)), not just raw price return - this accounts
 * for position sizing, so it reflects the trade's real impact rather than
 * only how the underlying moved. Computed here for display only; nothing
 * about how a trade's pnl was calculated changes.
 */
function computeReturnPct(trade: Trade): number | null {
  if (trade.pnl === null || trade.entryPrice === 0 || trade.size === 0) return null;
  return (trade.pnl / (trade.entryPrice * trade.size)) * 100;
}

interface TradeRowProps {
  trade: Trade;
}

/**
 * Each row owns its OWN expand/collapse state, rather than the parent
 * table tracking a set of expanded ids. Combined with `memo`, this means
 * expanding one trade's explanation only re-renders that single row - not
 * every row in the table - which is what actually matters for "stay
 * performant with larger trade histories," as opposed to a comment saying
 * so while every row still re-renders on any toggle.
 */
const TradeRow = memo(function TradeRow({ trade }: TradeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const returnPct = computeReturnPct(trade);
  const pnlIsPositive = trade.pnl !== null && trade.pnl >= 0;

  return (
    <>
      <tr className="text-slate-200">
        <td className="px-4 py-3 text-slate-400">{formatDate(trade.entryTime)}</td>
        <td className="px-4 py-3 text-slate-400">{formatDate(trade.exitTime)}</td>
        {/* The engine is long-only today (no short-selling support), so
            every trade IS a long position - this reflects that real
            behavior rather than a hardcoded/fake value. */}
        <td className="px-4 py-3">Long</td>
        <td className="px-4 py-3">{formatPrice(trade.entryPrice)}</td>
        <td className="px-4 py-3">{formatPrice(trade.exitPrice)}</td>
        <td className={`px-4 py-3 font-medium ${pnlIsPositive ? 'text-profit' : 'text-loss'}`}>
          {trade.pnl === null ? '—' : trade.pnl.toFixed(2)}
        </td>
        <td className={`px-4 py-3 font-medium ${pnlIsPositive ? 'text-profit' : 'text-loss'}`}>
          {returnPct === null ? '—' : `${returnPct.toFixed(2)}%`}
        </td>
        <td className="px-4 py-3 text-slate-400">
          {trade.exitReason ? (EXIT_REASON_LABEL[trade.exitReason] ?? trade.exitReason) : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="text-xs font-medium text-brand-400 hover:text-brand-300"
          >
            {isExpanded ? 'Hide' : 'Why?'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-surface">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Entry conditions
                </p>
                <TradeExplanation explanation={trade.entryExplanation} />
              </div>
              {trade.exitExplanation && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Exit conditions
                  </p>
                  <TradeExplanation explanation={trade.exitExplanation} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

interface TradeTableProps {
  trades: Trade[];
}

/**
 * A plain, un-virtualized table - appropriate for the trade counts a
 * single-symbol, single-position-at-a-time backtest actually produces
 * (typically tens to low hundreds per run), not the tens-of-thousands
 * range where virtualization would matter. `overflow-x-auto` + a min-width
 * on the table keeps it usable on narrow viewports without squeezing
 * eight columns unreadably, satisfying "responsive" without a layout
 * that reflows into something confusing at small sizes.
 */
export function TradeTable({ trades }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
        <p className="text-sm text-slate-400">This backtest didn&apos;t produce any trades.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-surface-raised text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Entry Date</th>
            <th className="px-4 py-3 font-medium">Exit Date</th>
            <th className="px-4 py-3 font-medium">Direction</th>
            <th className="px-4 py-3 font-medium">Entry Price</th>
            <th className="px-4 py-3 font-medium">Exit Price</th>
            <th className="px-4 py-3 font-medium">P&amp;L</th>
            <th className="px-4 py-3 font-medium">Return %</th>
            <th className="px-4 py-3 font-medium">Exit Reason</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Explanation</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
