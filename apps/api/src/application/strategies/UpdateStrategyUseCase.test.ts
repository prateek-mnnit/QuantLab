import { describe, expect, it } from 'vitest';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { UpdateStrategyUseCase } from './UpdateStrategyUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from './testFakes.js';

describe('UpdateStrategyUseCase', () => {
  it('updates an owned strategy and increments its version', async () => {
    const repository = new FakeStrategyRepository();
    const created = await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput());

    const updated = await new UpdateStrategyUseCase(repository).execute(
      created.id,
      'user-1',
      buildValidStrategyInput({ name: 'Renamed Strategy' }),
    );

    expect(updated.name).toBe('Renamed Strategy');
    expect(updated.version).toBe(2);
  });

  it('throws NotFoundError for a strategy id that does not exist', async () => {
    const useCase = new UpdateStrategyUseCase(new FakeStrategyRepository());

    await expect(
      useCase.execute('nonexistent-id', 'user-1', buildValidStrategyInput()),
    ).rejects.toThrow(/not found/i);
  });

  it('SECURITY: a built-in strategy can never be modified by a normal user - findByIdForUser is strictly own-only, so it never matches a userId-less row', async () => {
    const repository = new FakeStrategyRepository();
    const builtIn = await new CreateStrategyUseCase(repository).execute(
      null,
      buildValidStrategyInput({ name: 'Built-in Strategy' }),
      { isBuiltIn: true },
    );

    await expect(
      new UpdateStrategyUseCase(repository).execute(builtIn.id, 'user-1', buildValidStrategyInput({ name: 'Hijacked' })),
    ).rejects.toThrow(/not found/i);

    const stillBuiltIn = (await repository.findManyBuiltIn()).find((s) => s.id === builtIn.id);
    expect(stillBuiltIn?.name).toBe('Built-in Strategy');
  });

  it('SECURITY: throws NotFoundError (not the update) when the strategy belongs to a different user', async () => {
    const repository = new FakeStrategyRepository();
    const created = await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput());

    await expect(
      new UpdateStrategyUseCase(repository).execute(created.id, 'user-2', buildValidStrategyInput({ name: 'Hijacked' })),
    ).rejects.toThrow(/not found/i);

    // Confirm the attempted cross-user update never actually applied.
    const stillOwnedByUser1 = await repository.findByIdForUser(created.id, 'user-1');
    expect(stillOwnedByUser1?.name).not.toBe('Hijacked');
  });
});
