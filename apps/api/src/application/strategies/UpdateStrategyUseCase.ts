import type { Prisma } from '@prisma/client';
import type { StrategyRepository } from '../../infrastructure/persistence/repositories/StrategyRepository.js';
import type { Strategy, StrategyInput } from '@quantlab/shared-types';
import { NotFoundError } from '../errors/AppError.js';
import { toStrategyDto } from './StrategyMapper.js';

export class UpdateStrategyUseCase {
  constructor(private readonly strategyRepository: StrategyRepository) {}

  async execute(id: string, userId: string, input: StrategyInput): Promise<Strategy> {
    // Ownership check happens BEFORE the update, via the user-scoped
    // lookup - this is what prevents user A from editing user B's strategy
    // even if they somehow know B's strategy id.
    const existing = await this.strategyRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Strategy not found.');
    }

    const updated = await this.strategyRepository.update(id, {
      name: input.name,
      description: input.description ?? null,
      timeframe: input.timeframe,
      entryConditions: input.entryConditions as unknown as Prisma.InputJsonValue,
      exitConditions: input.exitConditions as unknown as Prisma.InputJsonValue,
      stopLossConfig: (input.stopLossConfig ?? null) as unknown as Prisma.InputJsonValue,
      takeProfitConfig: (input.takeProfitConfig ?? null) as unknown as Prisma.InputJsonValue,
      trailingStopConfig: (input.trailingStopConfig ?? null) as unknown as Prisma.InputJsonValue,
      positionSizingConfig: input.positionSizingConfig as unknown as Prisma.InputJsonValue,
      // Bumping version on every edit is a simple, honest signal that a
      // strategy has changed since a given backtest ran against it - full
      // version history (viewing/reverting old versions) stays out of scope
      // per the architecture doc's open questions.
      version: { increment: 1 },
    });

    return toStrategyDto(updated);
  }
}
