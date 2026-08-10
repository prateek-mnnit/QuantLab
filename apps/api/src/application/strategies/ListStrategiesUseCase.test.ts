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

  it('includes every built-in strategy for any authenticated user, alongside their own', async () => {
    const repository = new FakeStrategyRepository();
    await new CreateStrategyUseCase(repository).execute('user-1', buildValidStrategyInput({ name: 'My Strategy' }));
    await new CreateStrategyUseCase(repository).execute(null, buildValidStrategyInput({ name: 'Built-in A' }), {
      isBuiltIn: true,
    });
    await new CreateStrategyUseCase(repository).execute(null, buildValidStrategyInput({ name: 'Built-in B' }), {
      isBuiltIn: true,
    });

    const userOne = await new ListStrategiesUseCase(repository).execute('user-1');
    const userTwo = await new ListStrategiesUseCase(repository).execute('user-2');

    expect(userOne.map((s) => s.name).sort()).toEqual(['Built-in A', 'Built-in B', 'My Strategy']);
    // A different, brand-new user sees the SAME two built-ins - they are
    // product-level content, not owned by either user - but NOT "My
    // Strategy", which is user-1's alone.
    expect(userTwo.map((s) => s.name).sort()).toEqual(['Built-in A', 'Built-in B']);
    expect(userOne.filter((s) => s.isBuiltIn)).toHaveLength(2);
  });
});
