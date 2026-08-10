import { describe, expect, it } from 'vitest';
import { ListBacktestsUseCase } from './ListBacktestsUseCase.js';
import { FakeBacktestRunRepository } from './testFakes.js';

describe('ListBacktestsUseCase', () => {
  it("returns the requesting user's own runs plus every global example run, but never another user's runs", async () => {
    const repository = new FakeBacktestRunRepository();
    await repository.create({
      strategyId: 'strategy-user-1',
      userId: 'user-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await repository.create({
      strategyId: 'strategy-user-2',
      userId: 'user-2',
      symbol: 'MSFT',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await repository.create({
      strategyId: 'strategy-builtin',
      userId: null,
      symbol: 'RELIANCE.NS',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });

    const result = await new ListBacktestsUseCase(repository).execute('user-1');

    expect(result.map((run) => run.symbol).sort()).toEqual(['AAPL', 'RELIANCE.NS']);
    expect(result.find((run) => run.symbol === 'RELIANCE.NS')!.isBuiltIn).toBe(true);
    expect(result.find((run) => run.symbol === 'AAPL')!.isBuiltIn).toBe(false);
  });

  it('filters by strategyId when provided', async () => {
    const repository = new FakeBacktestRunRepository();
    await repository.create({
      strategyId: 'strategy-a',
      userId: 'user-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await repository.create({
      strategyId: 'strategy-b',
      userId: 'user-1',
      symbol: 'MSFT',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });

    const result = await new ListBacktestsUseCase(repository).execute('user-1', 'strategy-a');

    expect(result).toHaveLength(1);
    expect(result[0]!.symbol).toBe('AAPL');
  });
});
