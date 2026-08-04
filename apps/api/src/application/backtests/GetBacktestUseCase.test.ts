import { describe, expect, it } from 'vitest';
import { GetBacktestUseCase } from './GetBacktestUseCase.js';
import { FakeBacktestRunRepository } from './testFakes.js';

describe('GetBacktestUseCase', () => {
  it('returns a run owned by the requesting user', async () => {
    const repository = new FakeBacktestRunRepository(() => 'user-1');
    const run = await repository.create({
      strategyId: 'strategy-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });

    const result = await new GetBacktestUseCase(repository).execute(run.id, 'user-1');

    expect(result.id).toBe(run.id);
  });

  it('SECURITY: throws NotFoundError for a run owned by a different user', async () => {
    const repository = new FakeBacktestRunRepository(() => 'user-1');
    const run = await repository.create({
      strategyId: 'strategy-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });

    await expect(new GetBacktestUseCase(repository).execute(run.id, 'user-2')).rejects.toThrow(/not found/i);
  });

  it('throws NotFoundError for a run id that does not exist', async () => {
    const repository = new FakeBacktestRunRepository(() => 'user-1');

    await expect(new GetBacktestUseCase(repository).execute('nonexistent-id', 'user-1')).rejects.toThrow(/not found/i);
  });
});
