import type { Prisma, Strategy } from '@prisma/client';
import type { StrategyInput } from '@quantlab/shared-types';
import type { IStrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';

/**
 * An in-memory fake of IStrategyRepository - same purpose and pattern as
 * FakeUserRepository/FakeRefreshTokenRepository (Group V): exercises every
 * strategy use case's exact business logic (most importantly, the
 * per-user ownership scoping) with zero database involved.
 */
export class FakeStrategyRepository implements IStrategyRepository {
  private readonly strategies: Strategy[] = [];
  private idCounter = 0;

  async findManyByUser(userId: string): Promise<Strategy[]> {
    return this.strategies
      .filter((strategy) => strategy.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findByIdForUser(id: string, userId: string): Promise<Strategy | null> {
    return this.strategies.find((strategy) => strategy.id === id && strategy.userId === userId) ?? null;
  }

  async create(userId: string, data: Omit<Prisma.StrategyUncheckedCreateInput, 'userId'>): Promise<Strategy> {
    this.idCounter += 1;
    const now = new Date();
    const strategy: Strategy = {
      id: `strategy-${this.idCounter}`,
      userId,
      name: data.name as string,
      description: (data.description as string | null | undefined) ?? null,
      version: 1,
      timeframe: data.timeframe as string,
      entryConditions: data.entryConditions as Prisma.JsonValue,
      exitConditions: data.exitConditions as Prisma.JsonValue,
      stopLossConfig: (data.stopLossConfig as Prisma.JsonValue | undefined) ?? null,
      takeProfitConfig: (data.takeProfitConfig as Prisma.JsonValue | undefined) ?? null,
      trailingStopConfig: (data.trailingStopConfig as Prisma.JsonValue | undefined) ?? null,
      positionSizingConfig: data.positionSizingConfig as Prisma.JsonValue,
      createdAt: now,
      updatedAt: now,
    };
    this.strategies.push(strategy);
    return strategy;
  }

  async update(id: string, data: Prisma.StrategyUpdateInput): Promise<Strategy> {
    const strategy = this.strategies.find((candidate) => candidate.id === id);
    if (!strategy) {
      throw new Error(`FakeStrategyRepository: no strategy with id "${id}"`);
    }

    if (data.name !== undefined) strategy.name = data.name as string;
    if (data.description !== undefined) strategy.description = data.description as string | null;
    if (data.timeframe !== undefined) strategy.timeframe = data.timeframe as string;
    if (data.entryConditions !== undefined) strategy.entryConditions = data.entryConditions as Prisma.JsonValue;
    if (data.exitConditions !== undefined) strategy.exitConditions = data.exitConditions as Prisma.JsonValue;
    if (data.stopLossConfig !== undefined) strategy.stopLossConfig = data.stopLossConfig as Prisma.JsonValue;
    if (data.takeProfitConfig !== undefined) strategy.takeProfitConfig = data.takeProfitConfig as Prisma.JsonValue;
    if (data.trailingStopConfig !== undefined) strategy.trailingStopConfig = data.trailingStopConfig as Prisma.JsonValue;
    if (data.positionSizingConfig !== undefined) {
      strategy.positionSizingConfig = data.positionSizingConfig as Prisma.JsonValue;
    }

    // UpdateStrategyUseCase always bumps version via Prisma's `{ increment: 1 }`
    // update-operator syntax rather than a plain number - this fake
    // interprets that one specific shape rather than reimplementing
    // Prisma's full update-operator language, since it's the only operator
    // this codebase's use cases actually use.
    const version = data.version;
    if (version && typeof version === 'object' && 'increment' in version) {
      strategy.version += version.increment as number;
    } else if (typeof version === 'number') {
      strategy.version = version;
    }

    strategy.updatedAt = new Date();
    return strategy;
  }

  async delete(id: string): Promise<Strategy> {
    const index = this.strategies.findIndex((candidate) => candidate.id === id);
    if (index === -1) {
      throw new Error(`FakeStrategyRepository: no strategy with id "${id}"`);
    }
    const [deleted] = this.strategies.splice(index, 1);
    return deleted!;
  }
}

/**
 * A minimal, always-valid StrategyInput - one indicator-vs-value entry
 * condition, an empty exit group, no risk controls, fixed-share sizing.
 * Every test that just needs "a valid strategy" (rather than testing the
 * condition tree shape itself, which packages/domain already covers)
 * builds from this rather than repeating the same fixture in five files.
 */
export function buildValidStrategyInput(overrides: Partial<StrategyInput> = {}): StrategyInput {
  return {
    name: 'RSI Oversold Bounce',
    description: 'Buy when RSI(14) drops below 30.',
    timeframe: '1D',
    entryConditions: {
      type: 'AND',
      id: 'entry-root',
      children: [
        {
          type: 'CONDITION',
          id: 'entry-c1',
          left: { source: 'INDICATOR', indicator: 'RSI', params: { period: 14 } },
          operator: 'LESS_THAN',
          right: { source: 'VALUE', value: 30 },
        },
      ],
    },
    exitConditions: { type: 'AND', id: 'exit-root', children: [] },
    stopLossConfig: null,
    takeProfitConfig: null,
    trailingStopConfig: null,
    positionSizingConfig: { type: 'FIXED_SHARES', value: 1 },
    ...overrides,
  };
}
