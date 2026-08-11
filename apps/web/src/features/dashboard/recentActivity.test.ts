import { describe, expect, it } from 'vitest';
import type { BacktestRun, StrategySummary, WatchlistItem } from '@quantlab/shared-types';
import { buildRecentActivity, formatRelativeTime } from './recentActivity.js';

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

function watchlistItem(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: 'item-1',
    symbol: 'RELIANCE.NS',
    addedAt: '2024-01-03T00:00:00.000Z',
    isBuiltIn: false,
    ...overrides,
  };
}

describe('buildRecentActivity', () => {
  it('turns a personal strategy, backtest, and watchlist item into activity entries, joining the backtest to its strategy name', () => {
    const result = buildRecentActivity(
      [strategy({ id: 's1', name: 'RSI Reversal Clone', createdAt: '2024-01-01T00:00:00.000Z' })],
      [backtestRun({ id: 'r1', strategyId: 's1', symbol: 'TCS.NS', createdAt: '2024-01-02T00:00:00.000Z' })],
      [watchlistItem({ id: 'w1', symbol: 'INFY.NS', addedAt: '2024-01-03T00:00:00.000Z' })],
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ type: 'watchlist', title: 'Added to watchlist', detail: 'INFY.NS' });
    expect(result[1]).toMatchObject({ type: 'backtest', title: 'Ran backtest', detail: 'TCS.NS · RSI Reversal Clone' });
    expect(result[2]).toMatchObject({ type: 'strategy', title: 'Created strategy', detail: 'RSI Reversal Clone' });
  });

  it('excludes built-in/product-level content from every category', () => {
    const result = buildRecentActivity(
      [strategy({ id: 'builtin-s', isBuiltIn: true })],
      [backtestRun({ id: 'builtin-r', isBuiltIn: true })],
      [watchlistItem({ id: 'builtin-w', isBuiltIn: true })],
    );

    expect(result).toEqual([]);
  });

  it('sorts every category together by timestamp, most recent first', () => {
    const result = buildRecentActivity(
      [strategy({ id: 's1', createdAt: '2024-01-01T00:00:00.000Z' })],
      [backtestRun({ id: 'r1', strategyId: 's1', createdAt: '2024-01-03T00:00:00.000Z' })],
      [watchlistItem({ id: 'w1', addedAt: '2024-01-02T00:00:00.000Z' })],
    );

    expect(result.map((item) => item.type)).toEqual(['backtest', 'watchlist', 'strategy']);
  });

  it('respects the limit parameter', () => {
    const strategies = [1, 2, 3].map((n) => strategy({ id: `s${n}`, createdAt: `2024-01-0${n}T00:00:00.000Z` }));

    const result = buildRecentActivity(strategies, [], [], 2);

    expect(result).toHaveLength(2);
  });

  it('falls back to a generic label when a backtest references a strategy not in the list', () => {
    const result = buildRecentActivity([], [backtestRun({ strategyId: 'unknown-strategy', symbol: 'AAPL' })], []);

    expect(result[0]!.detail).toBe('AAPL · Strategy');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('returns "Just now" for under a minute', () => {
    expect(formatRelativeTime('2024-06-15T11:59:45.000Z', now)).toBe('Just now');
  });

  it('formats minutes', () => {
    expect(formatRelativeTime('2024-06-15T11:55:00.000Z', now)).toBe('5 minutes ago');
  });

  it('formats a single hour without pluralizing', () => {
    expect(formatRelativeTime('2024-06-15T11:00:00.000Z', now)).toBe('1 hour ago');
  });

  it('formats hours', () => {
    expect(formatRelativeTime('2024-06-15T07:00:00.000Z', now)).toBe('5 hours ago');
  });

  it('formats exactly one day as "Yesterday"', () => {
    expect(formatRelativeTime('2024-06-14T12:00:00.000Z', now)).toBe('Yesterday');
  });

  it('formats multiple days', () => {
    expect(formatRelativeTime('2024-06-12T12:00:00.000Z', now)).toBe('3 days ago');
  });

  it('falls back to a plain date beyond a week', () => {
    const result = formatRelativeTime('2024-06-01T12:00:00.000Z', now);

    expect(result).toBe(new Date('2024-06-01T12:00:00.000Z').toLocaleDateString());
  });
});
