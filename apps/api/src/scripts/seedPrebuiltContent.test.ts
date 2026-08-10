import { describe, expect, it } from 'vitest';
import type { Candle } from '@quantlab/shared-types';
import { STRATEGY_TEMPLATES } from '@quantlab/shared-types';
import {
  seedPrebuiltContent,
  FEATURED_WATCHLIST_SYMBOLS,
  EXAMPLE_BACKTEST_PLAN,
  type SeedPrebuiltContentDeps,
} from './seedPrebuiltContent.js';
import { FakeStrategyRepository } from '../application/strategies/testFakes.js';
import { CreateStrategyUseCase } from '../application/strategies/CreateStrategyUseCase.js';
import { FakeWatchlistRepository } from '../application/watchlist/testFakes.js';
import { AddToWatchlistUseCase } from '../application/watchlist/AddToWatchlistUseCase.js';
import { FakeBacktestRunRepository, FakeTradeRepository, FakeMarketDataProvider } from '../application/backtests/testFakes.js';
import { RunBacktestUseCase } from '../application/backtests/RunBacktestUseCase.js';

function flatCandle(time: number, price: number): Candle {
  return { time, open: price, high: price, low: price, close: price, volume: 1000 };
}

/**
 * Builds a full, independent set of fakes and wires them into real use
 * case instances exactly the way `seed.ts` wires real infrastructure -
 * `seedPrebuiltContent` is exercised through the SAME `CreateStrategyUseCase`/
 * `AddToWatchlistUseCase`/`RunBacktestUseCase` a real seed run uses, just
 * backed by in-memory fakes instead of Postgres/Yahoo Finance. A fresh set
 * is built per call so tests can seed once, then seed again against the
 * SAME state to verify idempotency.
 */
function buildDeps(overrides: Partial<SeedPrebuiltContentDeps> = {}): SeedPrebuiltContentDeps & {
  strategyRepository: FakeStrategyRepository;
  watchlistRepository: FakeWatchlistRepository;
  backtestRunRepository: FakeBacktestRunRepository;
} {
  const strategyRepository = new FakeStrategyRepository();
  const watchlistRepository = new FakeWatchlistRepository();
  // 300 flat candles is enough warm-up for every template's slowest
  // indicator (the 200-period SMA in sma-50-200-golden-cross, even though
  // that template isn't part of EXAMPLE_BACKTEST_PLAN) without needing a
  // price move large enough to actually trigger a trade - these tests are
  // about seeding orchestration, not the backtest engine's trade logic
  // (packages/domain already covers that).
  const candles = Array.from({ length: 300 }, (_, i) => flatCandle(i, 100));
  const marketDataProvider = new FakeMarketDataProvider(candles);
  const backtestRunRepository = new FakeBacktestRunRepository();

  return {
    strategyRepository,
    createStrategyUseCase: new CreateStrategyUseCase(strategyRepository),
    watchlistRepository,
    addToWatchlistUseCase: new AddToWatchlistUseCase(watchlistRepository, marketDataProvider),
    backtestRunRepository,
    runBacktestUseCase: new RunBacktestUseCase(
      strategyRepository,
      backtestRunRepository,
      new FakeTradeRepository(),
      marketDataProvider,
    ),
    ...overrides,
  };
}

describe('seedPrebuiltContent', () => {
  it('creates every built-in strategy, every featured watchlist symbol, and every planned example backtest on a fresh database - all with no owning user', async () => {
    const deps = buildDeps();

    const result = await seedPrebuiltContent(deps);

    expect(result.strategiesCreated).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(result.strategiesSkipped).toHaveLength(0);
    expect(result.watchlistItemsCreated).toHaveLength(FEATURED_WATCHLIST_SYMBOLS.length);
    expect(result.watchlistItemsSkipped).toHaveLength(0);
    expect(result.backtestsCreated).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
    expect(result.backtestsFailed).toHaveLength(0);

    const builtInStrategies = await deps.strategyRepository.findManyBuiltIn();
    expect(builtInStrategies).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(builtInStrategies.every((strategy) => strategy.userId === null)).toBe(true);

    const featuredItems = await deps.watchlistRepository.findManyBuiltIn();
    expect(featuredItems).toHaveLength(FEATURED_WATCHLIST_SYMBOLS.length);
    expect(featuredItems.every((item) => item.userId === null)).toBe(true);

    const exampleRuns = await deps.backtestRunRepository.findManyBuiltIn();
    expect(exampleRuns).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
    expect(exampleRuns.every((run) => run.userId === null)).toBe(true);
  });

  it('is visible to every user without a demo account: two independently-created users both see all the prebuilt content', async () => {
    const deps = buildDeps();
    await seedPrebuiltContent(deps);

    const userOne = await deps.strategyRepository.findManyVisibleToUser('user-1');
    const userTwo = await deps.strategyRepository.findManyVisibleToUser('user-2');
    expect(userOne).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(userTwo).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(userOne.map((s) => s.id).sort()).toEqual(userTwo.map((s) => s.id).sort());

    const watchlistOne = await deps.watchlistRepository.findManyVisibleToUser('user-1');
    const watchlistTwo = await deps.watchlistRepository.findManyVisibleToUser('user-2');
    expect(watchlistOne).toHaveLength(FEATURED_WATCHLIST_SYMBOLS.length);
    expect(watchlistTwo).toHaveLength(FEATURED_WATCHLIST_SYMBOLS.length);

    const backtestsOne = await deps.backtestRunRepository.findManyVisibleToUser('user-1');
    const backtestsTwo = await deps.backtestRunRepository.findManyVisibleToUser('user-2');
    expect(backtestsOne).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
    expect(backtestsTwo).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
  });

  it('is idempotent: seeding twice against the same repositories creates nothing new the second time', async () => {
    const deps = buildDeps();

    await seedPrebuiltContent(deps);
    const second = await seedPrebuiltContent(deps);

    expect(second.strategiesCreated).toHaveLength(0);
    expect(second.strategiesSkipped).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(second.watchlistItemsCreated).toHaveLength(0);
    expect(second.watchlistItemsSkipped).toHaveLength(FEATURED_WATCHLIST_SYMBOLS.length);
    expect(second.backtestsCreated).toHaveLength(0);
    expect(second.backtestsSkipped).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);

    expect(await deps.strategyRepository.findManyBuiltIn()).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(await deps.watchlistRepository.findManyBuiltIn()).toHaveLength(FEATURED_WATCHLIST_SYMBOLS.length);
    expect(await deps.backtestRunRepository.findManyBuiltIn()).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
  });

  it('retries an example backtest that previously failed instead of treating it as already seeded', async () => {
    const strategyRepository = new FakeStrategyRepository();
    const watchlistRepository = new FakeWatchlistRepository();
    const backtestRunRepository = new FakeBacktestRunRepository();
    // Fails every call - just enough to make the FIRST seed's example
    // backtests come back FAILED, without needing real market data.
    const failingProvider = new FakeMarketDataProvider([], new Error('Simulated provider outage'));

    const deps: SeedPrebuiltContentDeps = {
      strategyRepository,
      createStrategyUseCase: new CreateStrategyUseCase(strategyRepository),
      watchlistRepository,
      addToWatchlistUseCase: new AddToWatchlistUseCase(
        watchlistRepository,
        new FakeMarketDataProvider(Array.from({ length: 30 }, (_, i) => flatCandle(i, 100))),
      ),
      backtestRunRepository,
      runBacktestUseCase: new RunBacktestUseCase(
        strategyRepository,
        backtestRunRepository,
        new FakeTradeRepository(),
        failingProvider,
      ),
    };

    const first = await seedPrebuiltContent(deps);
    // Every strategy still gets created even though every backtest fails -
    // strategies and backtests are independent steps.
    expect(first.strategiesCreated).toHaveLength(STRATEGY_TEMPLATES.length);
    expect(first.backtestsFailed).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
    expect(first.backtestsCreated).toHaveLength(0);

    // Swap in a working provider (simulating the outage clearing) and seed
    // again - a FAILED run must not be treated as "already seeded".
    const workingCandles = Array.from({ length: 300 }, (_, i) => flatCandle(i, 100));
    deps.runBacktestUseCase = new RunBacktestUseCase(
      strategyRepository,
      backtestRunRepository,
      new FakeTradeRepository(),
      new FakeMarketDataProvider(workingCandles),
    );

    const second = await seedPrebuiltContent(deps);
    expect(second.backtestsCreated).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);
    expect(second.backtestsFailed).toHaveLength(0);
  });

  it("a user's own strategy/watchlist/backtest is untouched by seeding, and a personal backtest run against a built-in strategy stays correctly attributed to that user - not leaked as an example", async () => {
    const deps = buildDeps();
    await seedPrebuiltContent(deps);

    const personalStrategy = await deps.createStrategyUseCase.execute('user-1', {
      name: 'My Own Strategy',
      description: null,
      timeframe: '1D',
      entryConditions: { type: 'AND', id: 'root', children: [] },
      exitConditions: { type: 'AND', id: 'root', children: [] },
      stopLossConfig: null,
      takeProfitConfig: null,
      trailingStopConfig: null,
      positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    });
    await deps.watchlistRepository.create('user-1', 'MYOWNSTOCK.NS');

    // user-1 runs a PERSONAL backtest against a BUILT-IN strategy (not one
    // they own) - this is exactly the scenario the old (pre-correction)
    // demo-user architecture would have gotten wrong, since ownership used
    // to be derived entirely through the strategy's (then ownerless)
    // userId.
    const [builtInStrategy] = await deps.strategyRepository.findManyBuiltIn();
    const personalRunOnBuiltIn = await deps.runBacktestUseCase.execute('user-1', {
      strategyId: builtInStrategy!.id,
      symbol: 'AAPL',
      timeframe: '1D',
      dateFrom: new Date(Date.now() - 200 * 86_400_000).toISOString(),
      dateTo: new Date().toISOString(),
    });

    expect(personalRunOnBuiltIn.isBuiltIn).toBe(false);
    const user1Visible = await deps.backtestRunRepository.findManyVisibleToUser('user-1');
    expect(user1Visible.some((run) => run.id === personalRunOnBuiltIn.id)).toBe(true);
    const user2Visible = await deps.backtestRunRepository.findManyVisibleToUser('user-2');
    // user-2 sees every example run, but NOT user-1's personal run against
    // that same built-in strategy.
    expect(user2Visible.some((run) => run.id === personalRunOnBuiltIn.id)).toBe(false);
    expect(user2Visible).toHaveLength(EXAMPLE_BACKTEST_PLAN.length);

    const user1Strategies = await deps.strategyRepository.findManyVisibleToUser('user-1');
    expect(user1Strategies.filter((s) => !s.isBuiltIn)).toEqual([expect.objectContaining({ id: personalStrategy.id })]);
    const user2Strategies = await deps.strategyRepository.findManyVisibleToUser('user-2');
    expect(user2Strategies.some((s) => s.id === personalStrategy.id)).toBe(false);

    const user1Watchlist = await deps.watchlistRepository.findManyVisibleToUser('user-1');
    expect(user1Watchlist.some((item) => item.symbol === 'MYOWNSTOCK.NS')).toBe(true);
    const user2Watchlist = await deps.watchlistRepository.findManyVisibleToUser('user-2');
    expect(user2Watchlist.some((item) => item.symbol === 'MYOWNSTOCK.NS')).toBe(false);
  });
});
