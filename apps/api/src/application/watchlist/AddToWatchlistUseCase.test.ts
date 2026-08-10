import { describe, expect, it } from 'vitest';
import { AddToWatchlistUseCase } from './AddToWatchlistUseCase.js';
import { NotFoundError } from '../errors/AppError.js';
import { FakeMarketDataProvider, FakeWatchlistRepository, buildValidationCandle } from './testFakes.js';

function buildUseCase(marketDataProvider = new FakeMarketDataProvider([buildValidationCandle()])) {
  const watchlistRepository = new FakeWatchlistRepository();
  return {
    useCase: new AddToWatchlistUseCase(watchlistRepository, marketDataProvider),
    watchlistRepository,
  };
}

describe('AddToWatchlistUseCase', () => {
  it('adds a valid, real symbol to the watchlist', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute('user-1', 'AAPL');

    expect(result).toEqual({
      id: expect.any(String),
      symbol: 'AAPL',
      addedAt: expect.any(String),
      isBuiltIn: false,
    });
  });

  it('normalizes symbol casing and surrounding whitespace before storing', async () => {
    const { useCase, watchlistRepository } = buildUseCase();

    const result = await useCase.execute('user-1', '  aapl  ');

    expect(result.symbol).toBe('AAPL');
    const stored = await watchlistRepository.findOneForUser('user-1', 'AAPL');
    expect(stored).not.toBeNull();
  });

  it('rejects a symbol already on the same user\'s watchlist', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute('user-1', 'AAPL');

    await expect(useCase.execute('user-1', 'AAPL')).rejects.toThrow(/already on your watchlist/i);
  });

  it('allows two different users to each watch the same symbol', async () => {
    const { useCase, watchlistRepository } = buildUseCase();
    await useCase.execute('user-1', 'AAPL');

    await useCase.execute('user-2', 'AAPL');

    expect(await watchlistRepository.findOneForUser('user-1', 'AAPL')).not.toBeNull();
    expect(await watchlistRepository.findOneForUser('user-2', 'AAPL')).not.toBeNull();
  });

  it('allows the same user to add a different symbol after a duplicate rejection', async () => {
    const { useCase } = buildUseCase();
    await useCase.execute('user-1', 'AAPL');
    await expect(useCase.execute('user-1', 'AAPL')).rejects.toThrow(/already on your watchlist/i);

    const result = await useCase.execute('user-1', 'MSFT');

    expect(result.symbol).toBe('MSFT');
  });

  it('rejects a symbol the market data provider does not recognize, without saving it', async () => {
    const marketDataProvider = new FakeMarketDataProvider([], new NotFoundError('No market data found for symbol "ZZZZ".'));
    const { useCase, watchlistRepository } = buildUseCase(marketDataProvider);

    await expect(useCase.execute('user-1', 'ZZZZ')).rejects.toThrow(/no market data found/i);
    expect(await watchlistRepository.findOneForUser('user-1', 'ZZZZ')).toBeNull();
  });

  it('checks for an existing entry before calling the market data provider', async () => {
    const { useCase, watchlistRepository } = buildUseCase();
    await useCase.execute('user-1', 'AAPL');

    let providerWasCalled = false;
    const trackedProvider = new FakeMarketDataProvider([buildValidationCandle()]);
    trackedProvider.getCandles = async () => {
      providerWasCalled = true;
      return [buildValidationCandle()];
    };
    const duplicateUseCase = new AddToWatchlistUseCase(watchlistRepository, trackedProvider);

    await expect(duplicateUseCase.execute('user-1', 'AAPL')).rejects.toThrow(/already on your watchlist/i);
    expect(providerWasCalled).toBe(false);
  });
});
