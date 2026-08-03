import { describe, expect, it } from 'vitest';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { ListStrategiesUseCase } from './ListStrategiesUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from './testFakes.js';

describe('ListStrategiesUseCase', () => {
  it("returns only the requesting user's strategies, never another user's", async () => {
    const repository = new FakeStrategyRepository();
    await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput({ name: 'User 1 Strategy A' }));
    await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput({ name: 'User 1 Strategy B' }));
    await new CreateStrategyUseCase(repository).execute('user-2', buildValidStrategyInput({ name: 'User 2 Strategy' }));

    const result = await new ListStrategiesUseCase(repository).execute('user-1');

    expect(result).toHaveLength(2);
    expect(result.every((strategy) => strategy.name.startsWith('User 1'))).toBe(true);
  });

  it('returns an empty list for a user with no strategies', async () => {
    const result = await new ListStrategiesUseCase(new FakeStrategyRepository()).execute('user-with-nothing');

    expect(result).toEqual([]);
  });
});
