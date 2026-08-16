import { describe, expect, it } from 'vitest';
import type { BacktestRun, StrategySummary } from '@quantlab/shared-types';
import {
  computeBacktestsThisWeek,
  computeStrategyCounts,
  computeSuccessRate,
  formatBacktestPeriod,
} from './dashboardStats.js';

function strategy(overrides: Partial<StrategySummary> = {}): StrategySummary {
  return {
    id: 'strategy-1',
    name: 'My Strategy',
    description: null,
    timeframe: '1D',
    version: 1,
    isBuiltIn: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function backtestRun(overrides: Partial<BacktestRun> = {}): BacktestRun {
  return {
    id: 'run-1',
    strategyId: 'strategy-1',
    symbol: 'AAPL',
    timeframe: '1D',
    dateFrom: '2024-01-01T00:00:00.000Z',
    dateTo: '2024-02-01T00:00:00.000Z',
    status: 'COMPLETED',
    errorMessage: null,
    totalReturnPct: 5,
    cagr: null,
    winRate: null,
    profitFactor: null,
    maxDrawdownPct: null,
    sharpeRatio: null,
    totalTrades: 3,
    isBuiltIn: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    completedAt: '2024-01-02T00:05:00.000Z',
    ...overrides,
  };
}

describe('computeStrategyCounts', () => {
  it('splits total strategies into built-in and custom', () => {
    const result = computeStrategyCounts([
      strategy({ id: 's1', isBuiltIn: true }),
      strategy({ id: 's2', isBuiltIn: true }),
      strategy({ id: 's3', isBuiltIn: false }),
    ]);

    expect(result).toEqual({ total: 3, builtIn: 2, custom: 1 });
  });

  it('returns all zeros for an empty list', () => {
    expect(computeStrategyCounts([])).toEqual({ total: 0, builtIn: 0, custom: 0 });
  });
});

describe('computeBacktestsThisWeek', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('counts only backtests created within the last 7 days', () => {
    const result = computeBacktestsThisWeek(
      [
        backtestRun({ id: 'r1', createdAt: '2024-06-14T12:00:00.000Z' }), // 1 day ago
        backtestRun({ id: 'r2', createdAt: '2024-06-09T12:00:00.000Z' }), // exactly 6 days ago
        backtestRun({ id: 'r3', createdAt: '2024-06-01T12:00:00.000Z' }), // 2 weeks ago
      ],
      now,
    );

    expect(result).toBe(2);
  });

  it('returns 0 for an empty list', () => {
    expect(computeBacktestsThisWeek([], now)).toBe(0);
  });
});

describe('computeSuccessRate', () => {
  it('computes the share of profitable COMPLETED backtests', () => {
    const result = computeSuccessRate([
      backtestRun({ id: 'r1', status: 'COMPLETED', totalReturnPct: 5 }),
      backtestRun({ id: 'r2', status: 'COMPLETED', totalReturnPct: -3 }),
      backtestRun({ id: 'r3', status: 'COMPLETED', totalReturnPct: 10 }),
    ]);

    expect(result).toEqual({ percent: expect.closeTo(66.67, 1), profitableCount: 2, completedCount: 3 });
  });

  it('ignores non-COMPLETED runs', () => {
    const result = computeSuccessRate([
      backtestRun({ id: 'r1', status: 'COMPLETED', totalReturnPct: 5 }),
      backtestRun({ id: 'r2', status: 'FAILED', totalReturnPct: null }),
      backtestRun({ id: 'r3', status: 'PENDING', totalReturnPct: null }),
    ]);

    expect(result).toEqual({ percent: 100, profitableCount: 1, completedCount: 1 });
  });

  it('returns null when there are no completed backtests with a return value', () => {
    expect(computeSuccessRate([])).toBeNull();
    expect(computeSuccessRate([backtestRun({ status: 'FAILED', totalReturnPct: null })])).toBeNull();
  });
});

describe('formatBacktestPeriod', () => {
  it('formats a date range compactly, with the year on the end date', () => {
    expect(formatBacktestPeriod('2024-12-01T00:00:00.000Z', '2024-12-07T00:00:00.000Z')).toBe('Dec 1 – Dec 7, 2024');
  });
});
