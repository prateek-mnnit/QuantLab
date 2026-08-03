import { describe, expect, it } from 'vitest';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from './testFakes.js';

describe('CreateStrategyUseCase', () => {
  it('creates a strategy owned by the requesting user', async () => {
    const useCase = new CreateStrategyUseCase(new FakeStrategyRepository());

    const result = await useCase.execute('user-1', buildValidStrategyInput({ name: 'My Strategy' }));

    expect(result.userId).toBe('user-1');
    expect(result.name).toBe('My Strategy');
    expect(result.version).toBe(1);
  });

  it('defaults description to null when not provided', async () => {
    const useCase = new CreateStrategyUseCase(new FakeStrategyRepository());

    const result = await useCase.execute('user-1', buildValidStrategyInput({ description: undefined }));

    expect(result.description).toBeNull();
  });
});
