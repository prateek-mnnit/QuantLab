import { describe, expect, it } from 'vitest';
import { AddToWatchlistUseCase } from './AddToWatchlistUseCase.js';
import { ListWatchlistUseCase } from './ListWatchlistUseCase.js';
import { FakeMarketDataProvider, FakeWatchlistRepository, buildValidationCandle } from './testFakes.js';

function buildUseCases() {
  const watchlistRepository = new FakeWatchlistRepository();
  const marketDataProvider = new FakeMarketDataProvider([buildValidationCandle()]);
  return {
    addUseCase: new AddToWatchlistUseCase(watchlistRepository, marketDataProvider),
    listUseCase: new ListWatchlistUseCase(watchlistRepository),
  };
}

describe('ListWatchlistUseCase', () => {
  it("returns only the requesting user's watchlist items, never another user's", async () => {
    const { addUseCase, listUseCase } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');
    await addUseCase.execute('user-1', 'MSFT');
    await addUseCase.execute('user-2', 'TSLA');

    const result = await listUseCase.execute('user-1');

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.symbol).sort()).toEqual(['AAPL', 'MSFT']);
  });

  it('returns an empty list for a user with an empty watchlist', async () => {
    const { listUseCase } = buildUseCases();

    const result = await listUseCase.execute('user-with-nothing');

    expect(result).toEqual([]);
  });

  it('returns items shaped as the WatchlistItem DTO, not the raw Prisma row', async () => {
    const { addUseCase, listUseCase } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');

    const [item] = await listUseCase.execute('user-1');

    expect(item).toEqual({
      id: expect.any(String),
      symbol: 'AAPL',
      addedAt: expect.any(String),
      isBuiltIn: false,
    });
    expect(item).not.toHaveProperty('userId');
  });

  it('orders items most-recently-added first', async () => {
    const { addUseCase, listUseCase } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');
    await addUseCase.execute('user-1', 'MSFT');
    await addUseCase.execute('user-1', 'TSLA');

    const result = await listUseCase.execute('user-1');

    expect(result.map((item) => item.symbol)).toEqual(['TSLA', 'MSFT', 'AAPL']);
  });

  it('includes every featured/built-in symbol for any authenticated user, alongside their own', async () => {
    const { addUseCase, listUseCase } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');
    await addUseCase.execute(null, 'RELIANCE.NS', { isBuiltIn: true });
    await addUseCase.execute(null, 'TCS.NS', { isBuiltIn: true });

    const userOne = await listUseCase.execute('user-1');
    const userTwo = await listUseCase.execute('user-2');

    expect(userOne.map((item) => item.symbol).sort()).toEqual(['AAPL', 'RELIANCE.NS', 'TCS.NS']);
    // A different, brand-new user sees the SAME featured symbols - they
    // are product-level content, not owned by either user - but NOT
    // 'AAPL', which is user-1's personal addition alone.
    expect(userTwo.map((item) => item.symbol).sort()).toEqual(['RELIANCE.NS', 'TCS.NS']);
    expect(userOne.filter((item) => item.isBuiltIn)).toHaveLength(2);
  });
});
