import { describe, expect, it } from 'vitest';
import { AddToWatchlistUseCase } from './AddToWatchlistUseCase.js';
import { RemoveFromWatchlistUseCase } from './RemoveFromWatchlistUseCase.js';
import { FakeMarketDataProvider, FakeWatchlistRepository, buildValidationCandle } from './testFakes.js';

function buildUseCases() {
  const watchlistRepository = new FakeWatchlistRepository();
  const marketDataProvider = new FakeMarketDataProvider([buildValidationCandle()]);
  return {
    addUseCase: new AddToWatchlistUseCase(watchlistRepository, marketDataProvider),
    removeUseCase: new RemoveFromWatchlistUseCase(watchlistRepository),
    watchlistRepository,
  };
}

describe('RemoveFromWatchlistUseCase', () => {
  it("removes a symbol from the requesting user's watchlist", async () => {
    const { addUseCase, removeUseCase, watchlistRepository } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');

    await removeUseCase.execute('user-1', 'AAPL');

    expect(await watchlistRepository.findOneForUser('user-1', 'AAPL')).toBeNull();
  });

  it('normalizes symbol casing and whitespace the same way AddToWatchlistUseCase does', async () => {
    const { addUseCase, removeUseCase, watchlistRepository } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');

    await removeUseCase.execute('user-1', '  aapl  ');

    expect(await watchlistRepository.findOneForUser('user-1', 'AAPL')).toBeNull();
  });

  it('rejects removal of a symbol that is not on the watchlist', async () => {
    const { removeUseCase } = buildUseCases();

    await expect(removeUseCase.execute('user-1', 'AAPL')).rejects.toThrow(/not on your watchlist/i);
  });

  it("never removes another user's watchlist entry for the same symbol", async () => {
    const { addUseCase, removeUseCase, watchlistRepository } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');
    await addUseCase.execute('user-2', 'AAPL');

    await removeUseCase.execute('user-1', 'AAPL');

    expect(await watchlistRepository.findOneForUser('user-1', 'AAPL')).toBeNull();
    expect(await watchlistRepository.findOneForUser('user-2', 'AAPL')).not.toBeNull();
  });

  it('rejects removing a symbol that belongs only to a different user', async () => {
    const { addUseCase, removeUseCase } = buildUseCases();
    await addUseCase.execute('user-2', 'AAPL');

    await expect(removeUseCase.execute('user-1', 'AAPL')).rejects.toThrow(/not on your watchlist/i);
  });

  it('allows re-adding a symbol after it has been removed', async () => {
    const { addUseCase, removeUseCase, watchlistRepository } = buildUseCases();
    await addUseCase.execute('user-1', 'AAPL');
    await removeUseCase.execute('user-1', 'AAPL');

    const result = await addUseCase.execute('user-1', 'AAPL');

    expect(result.symbol).toBe('AAPL');
    expect(await watchlistRepository.findOneForUser('user-1', 'AAPL')).not.toBeNull();
  });
});
