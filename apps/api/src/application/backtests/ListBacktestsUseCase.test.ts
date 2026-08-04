import { describe, expect, it } from 'vitest';
import { ListBacktestsUseCase } from './ListBacktestsUseCase.js';
import { FakeBacktestRunRepository } from './testFakes.js';

describe('ListBacktestsUseCase', () => {
  it("returns only the requesting user's runs, never another user's", async () => {
    const repository = new FakeBacktestRunRepository((strategyId) => (strategyId === 'strategy-user-1' ? 'user-1' : 'user-2'));
    await repository.create({
      strategyId: 'strategy-user-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await repository.create({
      strategyId: 'strategy-user-2',
      symbol: 'MSFT',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });

    const result = await new ListBacktestsUseCase(repository).execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.symbol).toBe('AAPL');
  });

  it('filters by strategyId when provided', async () => {
    const repository = new FakeBacktestRunRepository(() => 'user-1');
    await repository.create({
      strategyId: 'strategy-a',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await repository.create({
      strategyId: 'strategy-b',
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
