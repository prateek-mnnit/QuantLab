import { describe, expect, it } from 'vitest';
import { STRATEGY_TEMPLATES, strategyInputSchema } from '@quantlab/shared-types';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { UpdateStrategyUseCase } from './UpdateStrategyUseCase.js';
import { FakeStrategyRepository } from './testFakes.js';

/**
 * These tests exist to catch exactly one class of regression: a future
 * change to `strategyInputSchema` or `condition-tree.schema.ts` (e.g. a
 * new refine() rule, a tightened indicator param bound) silently making one
 * of the hardcoded templates in
 * `packages/shared-types/src/types/strategy-templates.ts` invalid, without
 * anyone noticing until a user picks that template in the UI and gets a
 * confusing 400. Every template is static data, so "does it still validate"
 * and "does it still create" are the only two things worth asserting -
 * there's no business logic here to unit-test beyond that.
 */
describe('Built-in strategy templates', () => {
  it('ships at least the templates requested for Group AB', () => {
    const ids = STRATEGY_TEMPLATES.map((template) => template.id).sort();

    expect(ids).toEqual(
      ['bollinger-mean-reversion', 'breakout', 'macd-trend-following', 'rsi-reversal', 'sma-crossover'].sort(),
    );
  });

  it.each(STRATEGY_TEMPLATES)('$id validates against strategyInputSchema', (template) => {
    const result = strategyInputSchema.safeParse(template.input);

    expect(result.success).toBe(true);
  });

  it.each(STRATEGY_TEMPLATES)(
    '$id can be created through CreateStrategyUseCase exactly like a hand-built strategy',
    async (template) => {
      const useCase = new CreateStrategyUseCase(new FakeStrategyRepository());

      const created = await useCase.execute('user-1', template.input);

      expect(created).toMatchObject({ userId: 'user-1', name: template.input.name, version: 1 });
    },
  );

  it.each(STRATEGY_TEMPLATES)(
    '$id can be saved again through UpdateStrategyUseCase after being edited, unchanged',
    async (template) => {
      const repository = new FakeStrategyRepository();
      const created = await new CreateStrategyUseCase(repository).execute('user-1', template.input);

      // Simulates the real flow this feature exists for: apply the
      // template, tweak one field in the builder (here, the name - the
      // simplest possible edit), then save. Proves a template isn't a
      // dead end that only works untouched.
      const updated = await new UpdateStrategyUseCase(repository).execute(created.id, 'user-1', {
        ...template.input,
        name: `${template.input.name} (edited)`,
      });

      expect(updated.name).toBe(`${template.input.name} (edited)`);
      expect(updated.version).toBe(2);
    },
  );

  it('gives every template a unique id', () => {
    const ids = STRATEGY_TEMPLATES.map((template) => template.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
