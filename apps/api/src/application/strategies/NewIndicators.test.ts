import { describe, expect, it } from 'vitest';
import { strategyInputSchema } from '@quantlab/shared-types';
import type { StrategyInput } from '@quantlab/shared-types';
import { CreateStrategyUseCase } from './CreateStrategyUseCase.js';
import { FakeStrategyRepository, buildValidStrategyInput } from './testFakes.js';

/**
 * Every indicator the strategy builder offers flows through the exact same
 * generic path: `INDICATOR_CATALOG` (shared-types) drives the builder UI's
 * dropdowns, `strategyInputSchema`'s `operandSourceIndicator` accepts any
 * `IndicatorType` with a numeric `params` record, and
 * `CreateStrategyUseCase` persists whatever condition tree it's given
 * without inspecting which indicator it references. Nothing indicator-
 * specific exists at this layer - which is exactly why Group AB's
 * templates already prove SMA, RSI, MACD, Bollinger Bands, and ATR (as a
 * risk-management setting) work end-to-end. This file closes the two
 * remaining gaps: EMA (never referenced by any existing template or test
 * as a real condition) and ATR used AS a condition operand rather than a
 * risk-management value (also never exercised anywhere else).
 *
 * Domain-level correctness (does EMA actually compute the right number)
 * is covered separately in packages/domain/src/indicators/ema.test.ts and
 * atr.test.ts - these tests are about the surrounding integration: does
 * the HTTP-facing validation/creation pipeline accept a strategy that
 * uses them, the same way it already accepts one using SMA or RSI.
 */
describe('New indicators integrate with the existing strategy model (Group AC)', () => {
  function buildEmaCrossoverInput(overrides: Partial<StrategyInput> = {}): StrategyInput {
    return buildValidStrategyInput({
      name: 'EMA Crossover',
      entryConditions: {
        type: 'AND',
        id: 'ema-crossover-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'ema-crossover-entry-1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 10 } },
            operator: 'CROSSES_ABOVE',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 30 } },
          },
        ],
      },
      exitConditions: {
        type: 'AND',
        id: 'ema-crossover-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'ema-crossover-exit-1',
            left: { source: 'INDICATOR', indicator: 'EMA', params: { period: 10 } },
            operator: 'CROSSES_BELOW',
            right: { source: 'INDICATOR', indicator: 'EMA', params: { period: 30 } },
          },
        ],
      },
      ...overrides,
    });
  }

  it('an EMA-crossover strategy validates against strategyInputSchema', () => {
    const result = strategyInputSchema.safeParse(buildEmaCrossoverInput());

    expect(result.success).toBe(true);
  });

  it('an EMA-crossover strategy can be created through CreateStrategyUseCase', async () => {
    const useCase = new CreateStrategyUseCase(new FakeStrategyRepository());

    const created = await useCase.execute('user-1', buildEmaCrossoverInput());

    expect(created).toMatchObject({ userId: 'user-1', name: 'EMA Crossover', version: 1 });
  });

  function buildAtrConditionInput(): StrategyInput {
    return buildValidStrategyInput({
      name: 'ATR Volatility Filter',
      // ATR used directly AS a condition (a volatility filter: only enter
      // when ATR(14) exceeds a fixed threshold) - distinct from every
      // existing usage of ATR in this codebase, which is only ever as a
      // `stopLossConfig`/`trailingStopConfig` value, never a condition
      // operand.
      entryConditions: {
        type: 'AND',
        id: 'atr-filter-entry-root',
        children: [
          {
            type: 'CONDITION',
            id: 'atr-filter-entry-1',
            left: { source: 'INDICATOR', indicator: 'ATR', params: { period: 14 } },
            operator: 'GREATER_THAN',
            right: { source: 'VALUE', value: 2 },
          },
        ],
      },
      // buildValidStrategyInput()'s own default `exitConditions` has an
      // empty `children` array, which is valid TypeScript but fails
      // strategyInputSchema's runtime `children.min(1)` rule (the exact
      // gap documented in apps/api/src/test/integration/testHelpers.ts's
      // `buildHttpValidStrategyInput` from Group AA) - overridden here for
      // the same reason.
      exitConditions: {
        type: 'AND',
        id: 'atr-filter-exit-root',
        children: [
          {
            type: 'CONDITION',
            id: 'atr-filter-exit-1',
            left: { source: 'INDICATOR', indicator: 'ATR', params: { period: 14 } },
            operator: 'LESS_THAN',
            right: { source: 'VALUE', value: 1 },
          },
        ],
      },
    });
  }

  it('an ATR-as-condition strategy validates against strategyInputSchema', () => {
    const result = strategyInputSchema.safeParse(buildAtrConditionInput());

    expect(result.success).toBe(true);
  });

  it('an ATR-as-condition strategy can be created through CreateStrategyUseCase', async () => {
    const useCase = new CreateStrategyUseCase(new FakeStrategyRepository());

    const created = await useCase.execute('user-1', buildAtrConditionInput());

    expect(created).toMatchObject({ userId: 'user-1', name: 'ATR Volatility Filter', version: 1 });
  });
});
