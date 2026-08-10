import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { RunBacktestUseCase } from './RunBacktestUseCase.js';
import { FakeBacktestRunRepository, FakeMarketDataProvider, FakeTradeRepository } from './testFakes.js';
import { CreateStrategyUseCase } from '../strategies/CreateStrategyUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from '../strategies/testFakes.js';

function flatCandle(time: number, price: number): Candle {
  return { time, open: price, high: price, low: price, close: price, volume: 1000 };
}

/**
 * Builds a strategy with a guaranteed-empty entry-condition tree, so any
 * backtest run against it deterministically produces zero trades - these
 * tests verify RunBacktestUseCase's ORCHESTRATION (persistence, status
 * transitions, error handling), not the backtest engine's own trade logic,
 * which packages/domain already covers in full.
 */
async function seedStrategy(strategyRepository: FakeStrategyRepository, userId: string) {
  return new CreateStrategyUseCase(strategyRepository).execute(
    userId,
    buildValidStrategyInput({ entryConditions: { type: 'AND', id: 'root', children: [] } }),
  );
}

describe('RunBacktestUseCase', () => {
  it('runs to completion and persists metrics for a valid strategy with enough candle data', async () => {
    const strategyRepository = new FakeStrategyRepository();
    const strategy = await seedStrategy(strategyRepository, 'user-1');
    const backtestRunRepository = new FakeBacktestRunRepository();
    const tradeRepository = new FakeTradeRepository();
    const candles = Array.from({ length: 20 }, (_, i) => flatCandle(i, 100));
    const marketDataProvider = new FakeMarketDataProvider(candles);

    const useCase = new RunBacktestUseCase(strategyRepository, backtestRunRepository, tradeRepository, marketDataProvider);

    const result = await useCase.execute('user-1', {
      strategyId: strategy.id,
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: '2024-01-01',
      dateTo: '2024-02-01',
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.totalTrades).toBe(0);
    expect(result.completedAt).not.toBeNull();
  });

  it('rejects a strategyId the requesting user does not own, without ever calling the market data provider', async () => {
    const strategyRepository = new FakeStrategyRepository();
    const strategy = await seedStrategy(strategyRepository, 'user-1');
    const backtestRunRepository = new FakeBacktestRunRepository();
    let providerWasCalled = false;

    const marketDataProvider = new FakeMarketDataProvider();
    marketDataProvider.getCandles = async () => {
      providerWasCalled = true;
      return [];
    };

    const useCase = new RunBacktestUseCase(
      strategyRepository,
      backtestRunRepository,
      new FakeTradeRepository(),
      marketDataProvider,
    );

    await expect(
      useCase.execute('user-2', {
        strategyId: strategy.id,
        symbol: 'AAPL',
        timeframe: '1D',
        dateFrom: '2024-01-01',
        dateTo: '2024-02-01',
      }),
    ).rejects.toThrow(/strategy not found/i);

    expect(providerWasCalled).toBe(false);
  });

  it('marks the run FAILED (not a thrown error) when there is not enough candle data', async () => {
    const strategyRepository = new FakeStrategyRepository();
    const strategy = await seedStrategy(strategyRepository, 'user-1');
    const backtestRunRepository = new FakeBacktestRunRepository();
    // Only one candle - the use case requires at least two.
    const marketDataProvider = new FakeMarketDataProvider([flatCandle(0, 100)]);

    const useCase = new RunBacktestUseCase(
      strategyRepository,
      backtestRunRepository,
      new FakeTradeRepository(),
      marketDataProvider,
    );

    const result = await useCase.execute('user-1', {
      strategyId: strategy.id,
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: '2024-01-01',
      dateTo: '2024-01-02',
    });

    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toMatch(/not enough historical data/i);
  });

  it('marks the run FAILED (not a thrown error) when the market data provider itself throws', async () => {
    const strategyRepository = new FakeStrategyRepository();
    const strategy = await seedStrategy(strategyRepository, 'user-1');
    const backtestRunRepository = new FakeBacktestRunRepository();
    const marketDataProvider = new FakeMarketDataProvider([], new Error('No market data found for symbol "ZZZZZ".'));

    const useCase = new RunBacktestUseCase(
      strategyRepository,
      backtestRunRepository,
      new FakeTradeRepository(),
      marketDataProvider,
    );

    const result = await useCase.execute('user-1', {
      strategyId: strategy.id,
      symbol: 'ZZZZZ',
      timeframe: '1D',
      dateFrom: '2024-01-01',
      dateTo: '2024-02-01',
    });

    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toMatch(/no market data found/i);
  });
});
