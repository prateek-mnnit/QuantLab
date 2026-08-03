import { describe, expect, it } from 'vitest';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { GetStrategyUseCase } from './GetStrategyUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from './testFakes.js';

describe('GetStrategyUseCase', () => {
  it('returns a strategy owned by the requesting user', async () => {
    const repository = new FakeStrategyRepository();
    const created = await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput());

    const result = await new GetStrategyUseCase(repository).execute(created.id, 'user-1');

    expect(result.id).toBe(created.id);
  });

  it('SECURITY: throws NotFoundError for a strategy owned by a different user', async () => {
    const repository = new FakeStrategyRepository();
    const created = await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput());

    // Not just "different error" - the SAME NotFoundError a nonexistent id
    // would produce, so a user can't distinguish "not yours" from
    // "doesn't exist" (the ID-enumeration protection StrategyRepository's
    // own doc comment describes).
    await expect(new GetStrategyUseCase(repository).execute(created.id, 'user-2')).rejects.toThrow(/not found/i);
  });

  it('throws NotFoundError for a strategy id that does not exist at all', async () => {
    const useCase = new GetStrategyUseCase(new FakeStrategyRepository());

    await expect(useCase.execute('nonexistent-id', 'user-1')).rejects.toThrow(/not found/i);
  });
});
