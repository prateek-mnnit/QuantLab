import { describe, expect, it } from 'vitest';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { DeleteStrategyUseCase } from './DeleteStrategyUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from './testFakes.js';

describe('DeleteStrategyUseCase', () => {
  it('deletes a strategy owned by the requesting user', async () => {
    const repository = new FakeStrategyRepository();
    const created = await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput());

    await new DeleteStrategyUseCase(repository).execute(created.id, 'user-1');

    expect(await repository.findByIdForUser(created.id, 'user-1')).toBeNull();
  });

  it('SECURITY: throws NotFoundError and does NOT delete when the strategy belongs to a different user', async () => {
    const repository = new FakeStrategyRepository();
    const created = await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput());

    await expect(new DeleteStrategyUseCase(repository).execute(created.id, 'user-2')).rejects.toThrow(/not found/i);

    // The strategy must still exist for its real owner - the attempted
    // cross-user delete must never have reached the repository's delete().
    expect(await repository.findByIdForUser(created.id, 'user-1')).not.toBeNull();
  });

  it('throws NotFoundError for a strategy id that does not exist', async () => {
    const useCase = new DeleteStrategyUseCase(new FakeStrategyRepository());

    await expect(useCase.execute('nonexistent-id', 'user-1')).rejects.toThrow(/not found/i);
  });
});
