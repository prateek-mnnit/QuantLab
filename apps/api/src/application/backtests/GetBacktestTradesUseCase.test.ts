import { describe, expect, it } from 'vitest';
import { GetBacktestTradesUseCase } from './GetBacktestTradesUseCase.js';
import { FakeBacktestRunRepository, FakeTradeRepository } from './testFakes.js';

describe('GetBacktestTradesUseCase', () => {
  it("returns the run's trades when the requesting user owns it", async () => {
    const backtestRunRepository = new FakeBacktestRunRepository(() => 'user-1');
    const tradeRepository = new FakeTradeRepository();
    const run = await backtestRunRepository.create({
      strategyId: 'strategy-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await tradeRepository.createMany([
      {
        backtestRunId: run.id,
        entryTime: new Date('2024-01-05'),
        entryPrice: 100,
        exitTime: new Date('2024-01-10'),
        exitPrice: 110,
        size: 1,
        pnl: 10,
        exitReason: 'TAKE_PROFIT',
        entryExplanation: { type: 'CONDITION', id: 'c1', result: true, operator: 'LESS_THAN', leftValue: 20, rightValue: 30 },
      },
    ]);

    const result = await new GetBacktestTradesUseCase(backtestRunRepository, tradeRepository).execute(run.id, 'user-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.pnl).toBe(10);
  });

  it('SECURITY: throws NotFoundError (never the trades) for a run owned by a different user', async () => {
    const backtestRunRepository = new FakeBacktestRunRepository(() => 'user-1');
    const tradeRepository = new FakeTradeRepository();
    const run = await backtestRunRepository.create({
      strategyId: 'strategy-1',
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-02-01'),
      status: 'COMPLETED',
    });
    await tradeRepository.createMany([
      {
        backtestRunId: run.id,
        entryTime: new Date('2024-01-05'),
        entryPrice: 100,
        size: 1,
        entryExplanation: { type: 'CONDITION', id: 'c1', result: true, operator: 'LESS_THAN', leftValue: 20, rightValue: 30 },
      },
    ]);

    await expect(
      new GetBacktestTradesUseCase(backtestRunRepository, tradeRepository).execute(run.id, 'user-2'),
    ).rejects.toThrow(/not found/i);
  });
});
