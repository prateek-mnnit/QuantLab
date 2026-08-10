import { describe, expect, it } from 'vitest';
import type { Trade } from '@quantlab/shared-types';
import {
  computeDrawdownCurve,
  computeEquityCurve,
  computeExitReasonBreakdown,
  computeMonthlyPerformance,
  computePerformanceExtras,
  computeReturnHistogram,
  computeStreaks,
  getClosedTrades,
} from './backtestAnalytics.js';

/**
 * Minimal, always-valid Trade builder - every field defaults to a closed,
 * breakeven-ish trade so each test only needs to override the 2-3 fields
 * it actually cares about. Mirrors the `candle()` helper pattern
 * packages/domain's indicator tests already use for the same reason.
 */
function trade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 'trade-1',
    backtestRunId: 'run-1',
    entryTime: '2024-01-01T00:00:00.000Z',
    entryPrice: 100,
    exitTime: '2024-01-02T00:00:00.000Z',
    exitPrice: 100,
    size: 1,
    pnl: 0,
    exitReason: 'EXIT_SIGNAL',
    entryExplanation: { type: 'CONDITION', id: 'c1', result: true, operator: 'GREATER_THAN', leftValue: 1, rightValue: 0 },
    exitExplanation: null,
    ...overrides,
  };
}

describe('getClosedTrades', () => {
  it('keeps only trades with both a pnl and an exitTime', () => {
    const open = trade({ pnl: null, exitTime: null });
    const closed = trade({ pnl: 10, exitTime: '2024-01-02T00:00:00.000Z' });

    expect(getClosedTrades([open, closed])).toEqual([closed]);
  });
});

describe('computeEquityCurve', () => {
  it('returns an empty curve when there are no closed trades', () => {
    expect(computeEquityCurve([trade({ pnl: null, exitTime: null })])).toEqual([]);
  });

  it('seeds the first point at the first trade entry time, then compounds each trade return onto a 100 base', () => {
    // +10% then +10% on the new balance, not on the original 100 -
    // compounding, not simple addition.
    const t1 = trade({
      entryTime: '2024-01-01T00:00:00.000Z',
      entryPrice: 100,
      exitTime: '2024-01-02T00:00:00.000Z',
      size: 1,
      pnl: 10, // 10 / (100 * 1) = 10%
    });
    const t2 = trade({
      entryTime: '2024-01-02T00:00:00.000Z',
      entryPrice: 100,
      exitTime: '2024-01-03T00:00:00.000Z',
      size: 1,
      pnl: 10,
    });

    const curve = computeEquityCurve([t1, t2]);

    expect(curve).toHaveLength(3);
    expect(curve[0]!.equity).toBe(100);
    expect(curve[1]!.equity).toBeCloseTo(110, 5);
    expect(curve[2]!.equity).toBeCloseTo(121, 5);
  });

  it('sorts closed trades by exit time regardless of input order', () => {
    const later = trade({
      entryTime: '2024-01-05T00:00:00.000Z',
      exitTime: '2024-01-06T00:00:00.000Z',
      pnl: 5,
    });
    const earlier = trade({
      entryTime: '2024-01-01T00:00:00.000Z',
      exitTime: '2024-01-02T00:00:00.000Z',
      pnl: -5,
    });

    const curve = computeEquityCurve([later, earlier]);

    // First point is seeded from whichever trade exits FIRST once sorted
    // (earlier), not from input order (later).
    expect(curve[0]!.time).toBe(Math.floor(new Date('2024-01-01T00:00:00.000Z').getTime() / 1000));
  });
});

describe('computeDrawdownCurve', () => {
  it('is 0% at a new equity peak and negative below it', () => {
    const curve = computeDrawdownCurve([
      { time: 1, equity: 100 },
      { time: 2, equity: 120 },
      { time: 3, equity: 90 },
    ]);

    expect(curve[0]!.drawdownPct).toBe(0);
    expect(curve[1]!.drawdownPct).toBe(0);
    expect(curve[2]!.drawdownPct).toBeCloseTo(-25, 5); // (90 - 120) / 120
  });

  it('returns an empty curve for an empty equity curve', () => {
    expect(computeDrawdownCurve([])).toEqual([]);
  });
});

describe('computePerformanceExtras', () => {
  it('returns all-null extras when there are no closed trades', () => {
    expect(computePerformanceExtras([])).toEqual({
      averageWin: null,
      averageLoss: null,
      largestWin: null,
      largestLoss: null,
      expectancy: null,
      averageTradeDurationHours: null,
    });
  });

  it('computes average/largest win and loss, expectancy, and duration across wins and losses', () => {
    const win1 = trade({ pnl: 100, entryTime: '2024-01-01T00:00:00.000Z', exitTime: '2024-01-01T12:00:00.000Z' });
    const win2 = trade({ pnl: 50, entryTime: '2024-01-02T00:00:00.000Z', exitTime: '2024-01-02T06:00:00.000Z' });
    const loss = trade({ pnl: -30, entryTime: '2024-01-03T00:00:00.000Z', exitTime: '2024-01-03T18:00:00.000Z' });

    const extras = computePerformanceExtras([win1, win2, loss]);

    expect(extras.averageWin).toBe(75);
    expect(extras.largestWin).toBe(100);
    expect(extras.averageLoss).toBe(-30);
    expect(extras.largestLoss).toBe(-30);
    expect(extras.expectancy).toBeCloseTo(40, 5); // (100 + 50 - 30) / 3
    expect(extras.averageTradeDurationHours).toBeCloseTo(12, 5); // (12 + 6 + 18) / 3
  });

  it('leaves averageWin/largestWin null when every closed trade lost', () => {
    const extras = computePerformanceExtras([trade({ pnl: -10 })]);

    expect(extras.averageWin).toBeNull();
    expect(extras.largestWin).toBeNull();
    expect(extras.averageLoss).toBe(-10);
  });
});

describe('computeMonthlyPerformance', () => {
  it('groups by the EXIT month (UTC), not the entry month', () => {
    const spanningMonths = trade({
      entryTime: '2024-01-31T23:00:00.000Z',
      exitTime: '2024-02-01T01:00:00.000Z',
      pnl: 10,
    });

    const months = computeMonthlyPerformance([spanningMonths]);

    expect(months).toHaveLength(1);
    expect(months[0]!.monthKey).toBe('2024-02');
  });

  it('sums netPnl and computes winRate per month, sorted chronologically', () => {
    const febWin = trade({ exitTime: '2024-02-15T00:00:00.000Z', pnl: 20 });
    const febLoss = trade({ exitTime: '2024-02-20T00:00:00.000Z', pnl: -5 });
    const janWin = trade({ exitTime: '2024-01-10T00:00:00.000Z', pnl: 15 });

    const months = computeMonthlyPerformance([febWin, febLoss, janWin]);

    expect(months.map((m) => m.monthKey)).toEqual(['2024-01', '2024-02']);
    const feb = months[1]!;
    expect(feb.tradeCount).toBe(2);
    expect(feb.netPnl).toBe(15);
    expect(feb.winRate).toBe(50);
  });
});

describe('computeReturnHistogram', () => {
  it('returns no buckets when there are no closed trades', () => {
    expect(computeReturnHistogram([])).toEqual([]);
  });

  it('buckets every closed trade into one of bucketCount equal-width ranges', () => {
    // Returns of 0%, 50%, 100% (entryPrice=100, size=1 => pnl IS the % * 1).
    const trades = [0, 50, 100].map((pnl) => trade({ pnl, entryPrice: 100, size: 1 }));

    const buckets = computeReturnHistogram(trades, 2);

    expect(buckets).toHaveLength(2);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(3);
    expect(buckets[0]!.isPositive).toBe(true); // min (0%) is >= 0
  });

  it('does not divide by zero when every trade has the identical return', () => {
    const trades = [trade({ pnl: 10 }), trade({ pnl: 10 })];

    const buckets = computeReturnHistogram(trades, 4);

    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(2);
    expect(buckets.every((b) => Number.isFinite(b.count))).toBe(true);
  });
});

describe('computeExitReasonBreakdown', () => {
  it('excludes trades with no exitReason and sorts most-common first', () => {
    const trades = [
      trade({ exitReason: 'STOP_LOSS' }),
      trade({ exitReason: 'STOP_LOSS' }),
      trade({ exitReason: 'TAKE_PROFIT' }),
      trade({ exitReason: null }),
    ];

    const breakdown = computeExitReasonBreakdown(trades);

    expect(breakdown[0]).toMatchObject({ reason: 'STOP_LOSS', count: 2, label: 'Stop Loss' });
    expect(breakdown[0]!.pct).toBeCloseTo((2 / 3) * 100, 5);
    expect(breakdown.find((b) => b.reason === 'TAKE_PROFIT')).toMatchObject({ count: 1 });
  });

  it('returns an empty breakdown when there are no closed trades with an exit reason', () => {
    expect(computeExitReasonBreakdown([])).toEqual([]);
  });
});

describe('computeStreaks', () => {
  it('tracks the longest consecutive win and loss runs in exit-time order, breakeven trades reset both', () => {
    const trades = [1, 2, 3, 4, 5, 6].map((day) =>
      trade({ exitTime: `2024-01-0${day}T00:00:00.000Z` }),
    );
    // Sequence by exit time: win, win, loss, breakeven, loss, loss.
    trades[0]!.pnl = 10;
    trades[1]!.pnl = 5;
    trades[2]!.pnl = -3;
    trades[3]!.pnl = 0;
    trades[4]!.pnl = -1;
    trades[5]!.pnl = -2;

    const streaks = computeStreaks(trades);

    expect(streaks).toEqual({ maxConsecutiveWins: 2, maxConsecutiveLosses: 2 });
  });

  it('returns zero streaks when there are no closed trades', () => {
    expect(computeStreaks([])).toEqual({ maxConsecutiveWins: 0, maxConsecutiveLosses: 0 });
  });
});
